// src/db/custom-migrate.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local instead of .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrate() {
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
    
    // Check if enums exist and create them if they don't
    const checkAndCreateEnums = async () => {
      // Check if difficulty_level enum exists
      const difficultyLevelExists = await client.query(
        "SELECT 1 FROM pg_type WHERE typname = 'difficulty_level'"
      );
      
      if (difficultyLevelExists.rowCount === 0) {
        console.log('Creating difficulty_level enum...');
        await client.query(
          "CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard')"
        );
      } else {
        console.log('difficulty_level enum already exists, skipping creation');
      }
      
      // Check if question_type enum exists
      const questionTypeExists = await client.query(
        "SELECT 1 FROM pg_type WHERE typname = 'question_type'"
      );
      
      if (questionTypeExists.rowCount === 0) {
        console.log('Creating question_type enum...');
        await client.query(
          "CREATE TYPE question_type AS ENUM ('MultipleChoice', 'Matching', 'MultipleCorrectStatements', 'AssertionReason', 'DiagramBased', 'SequenceOrdering')"
        );
      } else {
        console.log('question_type enum already exists, skipping creation');
      }
      
      // Check if question_source_type enum exists
      const sourceTypeExists = await client.query(
        "SELECT 1 FROM pg_type WHERE typname = 'question_source_type'"
      );
      
      if (sourceTypeExists.rowCount === 0) {
        console.log('Creating question_source_type enum...');
        await client.query(
          "CREATE TYPE question_source_type AS ENUM ('PreviousYear', 'AI_Generated', 'Other')"
        );
      } else {
        console.log('question_source_type enum already exists, skipping creation');
      }
    };
    
    await checkAndCreateEnums();
    console.log('Enum check and creation completed.');
    
    // Check for sequence tables
    console.log('Checking for existing sequence tables...');
    
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sequence_ordering_questions', 'sequence_items')
    `);
    
    const existingTables = rows.map(row => row.table_name);
    console.log(`Found existing tables: ${existingTables.join(', ') || 'none'}`);
    
    // Check if questions table exists before creating sequence tables
    const questionsTableExists = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'questions'
    `);
    
    if (questionsTableExists.rowCount === 0) {
      console.log('Questions table does not exist yet. Skipping sequence tables creation.');
    } else {
      // If tables already exist, we'll skip creating them
      if (existingTables.includes('sequence_ordering_questions')) {
        console.log('sequence_ordering_questions table already exists. Skipping creation.');
      } else {
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
      
      if (existingTables.includes('sequence_items')) {
        console.log('sequence_items table already exists. Skipping creation.');
      } else {
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
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});