// src/db/record-specific-migration.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local instead of .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function recordSpecificMigration() {
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
    
    // Ensure drizzle_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at timestamp with time zone DEFAULT now()
      )
    `);
    
    // List of specific migration hashes to record as applied
    const migrationsToRecord = [
      '0003', // certain_moondragon
      '0004', 
      '0005',
      '0006'
      // Add any other migration hashes here
    ];
    
    // Record each migration
    for (const hash of migrationsToRecord) {
      try {
        await client.query(
          'INSERT INTO drizzle_migrations (hash) VALUES ($1) ON CONFLICT (hash) DO NOTHING',
          [hash]
        );
        console.log(`Migration ${hash} recorded successfully.`);
      } catch (error) {
        console.error(`Error recording migration ${hash}:`, error);
      }
    }
    
    // Verify recorded migrations
    const { rows } = await client.query(
      'SELECT hash FROM drizzle_migrations ORDER BY hash'
    );
    console.log('Recorded migrations:', rows.map(r => r.hash).join(', '));
    
  } catch (error) {
    console.error('Recording migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

recordSpecificMigration().catch(error => {
  console.error('Process failed:', error);
  process.exit(1);
});