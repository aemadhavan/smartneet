// src/db/record-migrations.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local instead of .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function recordMigrations() {
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
          hash text NOT NULL UNIQUE,
          created_at timestamp with time zone DEFAULT now()
        )
      `);
    }
    
    // Get applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT hash FROM drizzle_migrations'
    );
    const appliedHashes = appliedMigrations.map(row => row.hash);
    
    // Record each migration as applied but don't run the SQL
    for (const file of migrationFiles) {
      const fileHash = file.split('_')[0]; // Extract hash from filename
      
      // Skip if already applied
      if (appliedHashes.includes(fileHash)) {
        console.log(`Migration ${file} already recorded. Skipping.`);
        continue;
      }
      
      console.log(`Recording migration: ${file} as applied`);
      
      try {
        // Insert into drizzle_migrations to mark as applied
        await client.query(
          'INSERT INTO drizzle_migrations (hash) VALUES ($1) ON CONFLICT (hash) DO NOTHING',
          [fileHash]
        );
        console.log(`Migration ${file} recorded successfully.`);
      } catch (error) {
        console.error(`Error recording migration ${file}:`, error);
        throw error;
      }
    }
    
    console.log('All migrations recorded successfully!');
    
    // Verify migrations
    const { rows: finalMigrations } = await client.query(
      'SELECT hash, created_at FROM drizzle_migrations ORDER BY created_at'
    );
    
    console.log(`\nVerification: ${finalMigrations.length} migrations recorded:`);
    finalMigrations.forEach((m, i) => {
      console.log(`  ${i+1}. ${m.hash} - ${m.created_at}`);
    });
    
  } catch (error) {
    console.error('Recording migrations failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

recordMigrations().catch(error => {
  console.error('Process failed:', error);
  process.exit(1);
});