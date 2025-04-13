// src/db/custom-migrate.ts

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local instead of .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('Starting custom migration...');
  
  // Use XATA_DATABASE_URL specifically for Xata
  const dbUrl = process.env.XATA_DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('XATA_DATABASE_URL environment variable is not defined in .env.local');
  }
  
  console.log('Found Xata database URL');
  
  // Configure TLS/SSL properly for Xata
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: true, // For secure connections
    }
  });

  // Rest of your script...
  // ...
  
  // First check if the sequence tables already exist
  const client = await pool.connect();
  try {
    console.log('Connected to Xata database successfully');
    console.log('Checking for existing tables...');
    
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sequence_ordering_questions', 'sequence_items')
    `);
    
    const existingTables = rows.map(row => row.table_name);
    console.log(`Found existing tables: ${existingTables.join(', ') || 'none'}`);
    
    // If tables already exist, we'll skip creating them
    if (existingTables.length === 2) {
      console.log('Both sequence tables already exist. Skipping table creation.');
      return;
    }
    
    // Generate migration SQL for the sequence tables only
    console.log('Preparing to create sequence tables...');
    
    // We'll skip enum creation completely since they already exist
    console.log('Existing enums will be used, no enum creation needed.');
    
    // Create the tables directly if they don't exist
    if (!existingTables.includes('sequence_ordering_questions')) {
      console.log('Creating sequence_ordering_questions table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS sequence_ordering_questions (
          sequence_id SERIAL PRIMARY KEY,
          question_id INTEGER REFERENCES questions(question_id) ON DELETE CASCADE UNIQUE,
          intro_text TEXT,
          correct_sequence TEXT NOT NULL
        )
      `);
    }
    
    if (!existingTables.includes('sequence_items')) {
      console.log('Creating sequence_items table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS sequence_items (
          item_id SERIAL PRIMARY KEY,
          sequence_id INTEGER REFERENCES sequence_ordering_questions(sequence_id) ON DELETE CASCADE,
          item_number INTEGER NOT NULL,
          item_label VARCHAR(10),
          item_text TEXT NOT NULL
        )
      `);
    }
    
    console.log('Sequence tables created successfully.');
  } catch (error) {
    console.error('Error creating sequence tables:', error);
    throw error;
  } finally {
    client.release();
  }
  
  console.log('Migration completed successfully!');
  await pool.end();
}

main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});