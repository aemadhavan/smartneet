// src/db/future-migrations.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local instead of .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function applyFutureMigrations() {
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
    
    // Path to drizzle migrations
    const migrationsDir = path.resolve(process.cwd(), 'drizzle');
    
    // Get all SQL migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure they're in alphabetical order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Ensure the drizzle_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at timestamp with time zone DEFAULT now()
      )
    `);
    
    // Get applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT hash FROM drizzle_migrations'
    );
    const appliedHashes = appliedMigrations.map(row => row.hash);
    
    // Get existing enums to avoid recreating them
    const { rows: existingEnums } = await client.query(`
      SELECT typname FROM pg_type 
      WHERE typname IN ('difficulty_level', 'question_type', 'question_source_type')
    `);
    const enumNames = existingEnums.map(row => row.typname);
    console.log('Existing enums:', enumNames.join(', '));
    
    // Apply each new migration
    let appliedCount = 0;
    for (const file of migrationFiles) {
      const fileHash = file.split('_')[0]; // Extract hash from filename
      
      // Skip if already applied
      if (appliedHashes.includes(fileHash)) {
        console.log(`Migration ${file} already applied. Skipping.`);
        continue;
      }
      
      console.log(`Preparing to apply migration: ${file}`);
      
      // Read SQL content
      let sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Skip enum creation for existing enums
      function escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
      }

      for (const enumName of enumNames) {
        const escapedEnumName = escapeRegExp(enumName);
        // Replace CREATE TYPE statements
        sqlContent = sqlContent.replace(
          new RegExp(`CREATE TYPE ${escapedEnumName} AS ENUM \\([^)]+\\);`, 'g'),
          `-- Skipped enum creation for existing enum: ${enumName}`
        );
        
        // Replace DROP TYPE statements
        sqlContent = sqlContent.replace(
          new RegExp(`DROP TYPE ${escapedEnumName};`, 'g'),
          `-- Skipped enum deletion for existing enum: ${enumName}`
        );
      }
      
      // Apply the modified migration
      await client.query('BEGIN');
      try {
        console.log(`Applying migration: ${file}`);
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO drizzle_migrations (hash) VALUES ($1)',
          [fileHash]
        );
        await client.query('COMMIT');
        console.log(`Migration ${file} applied successfully.`);
        appliedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error applying migration ${file}:`, error);
        throw error;
      }
    }
    
    if (appliedCount === 0) {
      console.log('No new migrations to apply.');
    } else {
      console.log(`Successfully applied ${appliedCount} new migrations.`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applyFutureMigrations().catch(error => {
  console.error('Process failed:', error);
  process.exit(1);
});
