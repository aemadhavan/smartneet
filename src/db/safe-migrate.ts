// src/db/safe-migrate.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local instead of .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Interface for PostgreSQL errors
interface PostgresError extends Error {
  length?: number;
  severity?: string;
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
  file?: string;
  line?: string;
  routine?: string;
}

async function safeMigrate() {
  // Connect directly to PostgreSQL
  const client = new Client({
    connectionString: process.env.XATA_DATABASE_URL,
    ssl: {
      rejectUnauthorized: true, // For secure connections to Xata
    }
  });
  
  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    // Step 1: Ensure drizzle_migrations table exists
    console.log('\n=== Step 1: Ensuring drizzle_migrations table exists ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at timestamp with time zone DEFAULT now()
      )
    `);
    console.log('✅ drizzle_migrations table is ready');
    
    // Step 2: Get migrations directory and find SQL files
    console.log('\n=== Step 2: Finding migration files ===');
    const migrationsDir = path.resolve(process.cwd(), 'drizzle');
    
    // Get all SQL migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure they're in alphabetical order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Step 3: Get already applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT hash FROM drizzle_migrations'
    );
    const appliedHashes = appliedMigrations.map(row => row.hash);
    console.log(`${appliedMigrations.length} migrations already applied`);
    
    // Step 4: Get existing enums and check for new ones
    console.log('\n=== Step 3: Checking existing database objects ===');
    const { rows: existingEnums } = await client.query(`
      SELECT typname FROM pg_type 
      WHERE typname IN (
        'difficulty_level', 
        'question_type', 
        'question_source_type',
        'session_type',
        'mastery_level'
      )
    `);
    const enumNames = existingEnums.map(row => row.typname);
    console.log('Existing enums:', enumNames.join(', '));
    
    // Check which enums need to be created
    const allEnums = ['difficulty_level', 'question_type', 'question_source_type', 'session_type', 'mastery_level'];
    const enumsToCreate = allEnums.filter(name => !enumNames.includes(name));
    
    if (enumsToCreate.length > 0) {
      console.log('Creating missing enums:', enumsToCreate.join(', '));
      
      // Create missing enums
      await client.query('BEGIN');
      
      try {
        // session_type enum
        if (enumsToCreate.includes('session_type')) {
          await client.query(`
            CREATE TYPE session_type AS ENUM (
              'Practice',
              'Test',
              'Review',
              'Custom'
            )
          `);
          console.log('✅ Created session_type enum');
        }
        
        // mastery_level enum
        if (enumsToCreate.includes('mastery_level')) {
          await client.query(`
            CREATE TYPE mastery_level AS ENUM (
              'notStarted',
              'beginner',
              'intermediate',
              'advanced',
              'mastered'
            )
          `);
          console.log('✅ Created mastery_level enum');
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating enums:', error instanceof Error ? error.message : String(error));
        throw error;
      }
    }
    
    // Step 5: Apply each new migration with modifications
    console.log('\n=== Step 4: Applying migrations ===');
    let appliedCount = 0;
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const fileHash = file.split('_')[0]; // Extract hash from filename
      
      // Skip if already applied
      if (appliedHashes.includes(fileHash)) {
        console.log(`🔄 Migration ${file} already applied. Skipping.`);
        continue;
      }
      
      console.log(`📄 Processing migration: ${file}`);
      
      // Read SQL content
      let sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // CRITICAL: Remove CREATE TYPE statements for existing enums
      for (const enumName of enumNames) {
        // Sanitize enumName for use in regex
        const safeEnumName = enumName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

        const createTypeRegex = new RegExp(`CREATE TYPE ${safeEnumName} AS ENUM \\([^)]+\\);`, 'g');
        sqlContent = sqlContent.replace(createTypeRegex, 
          `-- Skipped: CREATE TYPE ${enumName} (already exists)`);
        
        // Also remove any DROP TYPE statements for these enums
        const dropTypeRegex = new RegExp(`DROP TYPE ${safeEnumName};`, 'g');
        sqlContent = sqlContent.replace(dropTypeRegex, 
          `-- Skipped: DROP TYPE ${enumName} (already exists)`);
      }
      
      // Modify CREATE TABLE statements to use IF NOT EXISTS
      sqlContent = sqlContent.replace(/CREATE TABLE ([^(]+)(\s*\()/g, 'CREATE TABLE IF NOT EXISTS $1$2');
      
      // Remove any reference to sequence tables
      sqlContent = sqlContent.replace(/CREATE TABLE IF NOT EXISTS sequence_ordering_questions[\s\S]*?;/g, 
        '-- Skipped: sequence_ordering_questions table creation');
      sqlContent = sqlContent.replace(/CREATE TABLE IF NOT EXISTS sequence_items[\s\S]*?;/g, 
        '-- Skipped: sequence_items table creation');
      
      // Apply the modified SQL
      console.log('Applying modified migration...');
      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        
        // Record the migration
        await client.query(
          'INSERT INTO drizzle_migrations (hash) VALUES ($1)',
          [fileHash]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Migration ${file} applied successfully`);
        appliedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        
        const pgError = error as PostgresError;
        console.error(`❌ Error applying migration ${file}:`, pgError);
        console.error('SQL Error:', pgError.message);
        
        // Print the problematic SQL statement if possible
        if (pgError.position) {
          const position = parseInt(pgError.position);
          const errorContext = sqlContent.substring(
            Math.max(0, position - 100), 
            Math.min(sqlContent.length, position + 100)
          );
          console.error('SQL context around error:');
          console.error('...' + errorContext + '...');
        }
        
        throw error;
      }
    }
    
    // Step 6: Summary
    console.log('\n=== Migration Summary ===');
    if (appliedCount === 0) {
      console.log('✅ All migrations were already applied. No changes made.');
    } else {
      console.log(`✅ Successfully applied ${appliedCount} new migrations.`);
    }
    
    console.log('\n🎉 Migration process completed!');
    
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
safeMigrate().catch(error => {
  console.error('Migration process failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
