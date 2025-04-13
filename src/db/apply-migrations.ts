// src/db/apply-migrations.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local instead of .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function applyMigrations() {
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
    
    // Check for drizzle migration table
    const migrationTableExists = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'drizzle_migrations'
    `);
    
    if (migrationTableExists.rowCount === 0) {
      console.log('Creating drizzle_migrations table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at timestamp with time zone DEFAULT now()
        )
      `);
    }
    
    // Get database schema information (existing tables)
    const { rows: existingTables } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tableNames = existingTables.map(row => row.table_name);
    console.log('Existing tables:', tableNames.join(', '));
    
    // Get applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT hash FROM drizzle_migrations'
    );
    const appliedHashes = appliedMigrations.map(row => row.hash);
    
    // Apply each migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const fileHash = file.split('_')[0]; // Extract hash from filename
      
      // Skip if already applied
      if (appliedHashes.includes(fileHash)) {
        console.log(`Migration ${file} already applied. Skipping.`);
        continue;
      }
      
      console.log(`Processing migration: ${file}`);
      
      // Read SQL content
      let sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Modify SQL to skip enum creations and table creations that already exist
      sqlContent = sqlContent
        // Remove CREATE TYPE statements for existing enums
        .replace(/CREATE TYPE (difficulty_level|question_type|question_source_type) AS ENUM \([^)]+\);/g, 
          '-- Skipped enum creation: $1')
        // Remove any DROP TYPE statements for existing enums
        .replace(/DROP TYPE (difficulty_level|question_type|question_source_type);/g, 
          '-- Skipped enum deletion: $1');
      
      // Modify CREATE TABLE statements to use IF NOT EXISTS
      sqlContent = sqlContent.replace(/CREATE TABLE ([^(]+)(\s*\()/g, 'CREATE TABLE IF NOT EXISTS $1$2');
      
      // Extract all CREATE TABLE statements to check for existing tables
      const createTableRegex = /CREATE TABLE IF NOT EXISTS ([^\s(]+)/g;
      let match;
      let tablesToCreate = [];
      
      while ((match = createTableRegex.exec(sqlContent)) !== null) {
        const tableName = match[1].replace(/"/g, '').trim();
        // Remove schema if present (e.g., "public"."table_name" -> table_name)
        const cleanTableName = tableName.split('.').pop();
        tablesToCreate.push(cleanTableName);
      }
      
      // Check if all tables in this migration already exist
      const allTablesExist = tablesToCreate.every(table => tableNames.includes(table));
      
      if (tablesToCreate.length > 0 && allTablesExist) {
        console.log(`All tables in ${file} already exist. Recording migration as applied.`);
        await client.query(
          'INSERT INTO drizzle_migrations (hash) VALUES ($1)',
          [fileHash]
        );
        continue; // Skip to next migration
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
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error applying migration ${file}:`, error);
        throw error;
      }
    }
    
    console.log('All migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigrations().catch(error => {
  console.error('Migration process failed:', error);
  process.exit(1);
});