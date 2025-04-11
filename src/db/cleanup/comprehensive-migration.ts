import { Pool } from 'pg';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

dotenv.config();

// Initialize the database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function performMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting comprehensive migration...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // --- PART 1: Check and create enums if they don't exist ---
    console.log('Checking enum types...');
    
    // Check if question_type enum exists
    const questionTypeEnumExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'question_type'
      );
    `);
    
    if (!questionTypeEnumExists.rows[0].exists) {
      console.log('Creating question_type enum...');
      await client.query(`
        CREATE TYPE question_type AS ENUM (
          'MultipleChoice',
          'Matching',
          'MultipleCorrectStatements',
          'AssertionReason',
          'DiagramBased',
          'SequenceOrdering'
        );
      `);
    } else {
      console.log('question_type enum already exists');
    }
    
    // Check if question_source_type enum exists
    const questionSourceTypeEnumExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'question_source_type'
      );
    `);
    
    if (!questionSourceTypeEnumExists.rows[0].exists) {
      console.log('Creating question_source_type enum...');
      await client.query(`
        CREATE TYPE question_source_type AS ENUM (
          'PreviousYear',
          'AI_Generated',
          'Other'
        );
      `);
    } else {
      console.log('question_source_type enum already exists');
    }
    
    // Check if difficulty_level enum exists
    const difficultyLevelEnumExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'difficulty_level'
      );
    `);
    
    if (!difficultyLevelEnumExists.rows[0].exists) {
      console.log('Creating difficulty_level enum...');
      await client.query(`
        CREATE TYPE difficulty_level AS ENUM (
          'easy',
          'medium',
          'hard'
        );
      `);
    } else {
      console.log('difficulty_level enum already exists');
    }
    
    // --- PART 2: Check if questions table exists and its column types ---
    console.log('Checking questions table structure...');
    
    const tableExistsQuery = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'questions'
      );
    `);
    
    const questionsTableExists = tableExistsQuery.rows[0].exists;
    
    if (questionsTableExists) {
      console.log('questions table exists, checking column types...');
      
      // Check question_type column
      const questionTypeColInfo = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'question_type'
      `);
      
      if (questionTypeColInfo.rows.length > 0) {
        const currentType = questionTypeColInfo.rows[0].data_type;
        console.log(`Current question_type column type: ${currentType}`);
        
        if (currentType.toLowerCase() !== 'user-defined' && currentType.toLowerCase() !== 'question_type') {
          console.log('Fixing question_type column...');
          
          // Create a temporary column with the correct type
          await client.query(`
            ALTER TABLE questions ADD COLUMN question_type_new question_type;
          `);
          
          // Let's see if there's data to migrate
          const hasDataQuery = await client.query(`
            SELECT COUNT(*) FROM questions;
          `);
          
          if (parseInt(hasDataQuery.rows[0].count) > 0) {
            console.log(`Found ${hasDataQuery.rows[0].count} rows to migrate data for`);
            
            // Get distinct values to ensure they match enum values
            const distinctValuesQuery = await client.query(`
              SELECT DISTINCT question_type FROM questions;
            `);
            
            console.log('Distinct values in question_type:', distinctValuesQuery.rows);
            
            // Try to transfer data with explicit casting
            try {
              await client.query(`
                UPDATE questions 
                SET question_type_new = question_type::text::question_type;
              `);
              console.log('Data transferred to new column');
            } catch (castError) {
              console.error('Error casting data to enum:', castError);
              console.log('Attempting to map values manually...');
              
              // Handle each value explicitly if casting fails
              const enumValues = [
                'MultipleChoice', 'Matching', 'MultipleCorrectStatements', 
                'AssertionReason', 'DiagramBased', 'SequenceOrdering'
              ];
              
              for (const val of distinctValuesQuery.rows) {
                const originalValue = val.question_type;
                let targetValue = originalValue;
                
                // Try to find a matching enum value (case-insensitive)
                const matchingEnumValue = enumValues.find(
                  enumVal => enumVal.toLowerCase() === originalValue.toLowerCase()
                );
                
                if (matchingEnumValue) {
                  targetValue = matchingEnumValue;
                  await client.query(`
                    UPDATE questions 
                    SET question_type_new = $1::question_type
                    WHERE LOWER(question_type::text) = LOWER($2)
                  `, [targetValue, originalValue]);
                  console.log(`Mapped ${originalValue} to ${targetValue}`);
                } else {
                  console.log(`Warning: No matching enum value found for ${originalValue}`);
                  // Set a default value if needed
                  await client.query(`
                    UPDATE questions 
                    SET question_type_new = 'MultipleChoice'::question_type
                    WHERE question_type = $1
                  `, [originalValue]);
                }
              }
            }
          }
          
          // Replace the old column
          await client.query(`
            ALTER TABLE questions DROP COLUMN question_type;
            ALTER TABLE questions RENAME COLUMN question_type_new TO question_type;
          `);
          
          console.log('question_type column fixed');
        }
      }
      
      // Check source_type column
      const sourceTypeColInfo = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'source_type'
      `);
      
      if (sourceTypeColInfo.rows.length > 0) {
        const currentType = sourceTypeColInfo.rows[0].data_type;
        console.log(`Current source_type column type: ${currentType}`);
        
        if (currentType.toLowerCase() !== 'user-defined' && currentType.toLowerCase() !== 'question_source_type') {
          console.log('Fixing source_type column...');
          
          // Similar approach for source_type
          await client.query(`
            ALTER TABLE questions ADD COLUMN source_type_new question_source_type;
          `);
          
          // Transfer data if there's any
          try {
            await client.query(`
              UPDATE questions 
              SET source_type_new = source_type::text::question_source_type;
            `);
          } catch (castError) {
            console.error('Error casting data:', castError);
            // Set default value
            await client.query(`
              UPDATE questions 
              SET source_type_new = 'Other'::question_source_type;
            `);
          }
          
          await client.query(`
            ALTER TABLE questions DROP COLUMN source_type;
            ALTER TABLE questions RENAME COLUMN source_type_new TO source_type;
          `);
          
          console.log('source_type column fixed');
        }
      }
      
      // Check difficulty_level column
      const difficultyColInfo = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'difficulty_level'
      `);
      
      if (difficultyColInfo.rows.length > 0) {
        const currentType = difficultyColInfo.rows[0].data_type;
        console.log(`Current difficulty_level column type: ${currentType}`);
        
        if (currentType.toLowerCase() !== 'user-defined' && currentType.toLowerCase() !== 'difficulty_level') {
          console.log('Fixing difficulty_level column...');
          
          await client.query(`
            ALTER TABLE questions ADD COLUMN difficulty_level_new difficulty_level;
          `);
          
          try {
            await client.query(`
              UPDATE questions 
              SET difficulty_level_new = difficulty_level::text::difficulty_level;
            `);
          } catch (castError) {
            console.error('Error casting data:', castError);
            // Set default value
            await client.query(`
              UPDATE questions 
              SET difficulty_level_new = 'medium'::difficulty_level;
            `);
          }
          
          await client.query(`
            ALTER TABLE questions DROP COLUMN difficulty_level;
            ALTER TABLE questions RENAME COLUMN difficulty_level_new TO difficulty_level;
          `);
          
          console.log('difficulty_level column fixed');
        }
      }
    } else {
      console.log('questions table does not exist yet, no column fixes needed');
    }
    
    // --- PART 3: Now run the regular Drizzle migrations ---
    console.log('Running Drizzle migrations...');
    
    // Commit transaction from custom fixes
    await client.query('COMMIT');
    client.release();
    
    // Run Drizzle migrations
    try {
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('Drizzle migrations completed successfully');
    } catch (migrationError) {
      console.error('Error during Drizzle migrations:', migrationError);
      throw migrationError;
    }
    
    console.log('Comprehensive migration process completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    await client.query('ROLLBACK');
    client.release();
  } finally {
    await pool.end();
  }
}

// Run the migration
performMigration().catch(console.error);