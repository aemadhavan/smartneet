import dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

dotenv.config();

// Initialize the database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);
interface EnumType {
    schema: string;
    type_name: string;
    enum_values: string[];
  }
  
  interface DatabaseInfo {
    enums: EnumType[];
    tableExists: boolean;
  }
  async function inspectDatabase(): Promise<DatabaseInfo>{
  try {
    console.log('Inspecting database...');
    
    // Check for existing types
    const enumTypesQuery = await pool.query(`
      SELECT n.nspname as schema,
             t.typname as type_name,
             array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY schema, type_name;
    `);
    
    console.log('Existing Enum Types:');
    console.log(JSON.stringify(enumTypesQuery.rows, null, 2));
    
    // Check if questions table exists
    const tableExistsQuery = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'questions'
      );
    `);
    
    if (tableExistsQuery.rows[0].exists) {
      // Check table structure for questions table
      const tableStructureQuery = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'questions'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nCurrent Questions Table Structure:');
      console.log(JSON.stringify(tableStructureQuery.rows, null, 2));
    } else {
      console.log('\nQuestions table does not exist yet.');
    }
    
    return {
      enums: enumTypesQuery.rows,
      tableExists: tableExistsQuery.rows[0].exists
    };
    
  } catch (error) {
    console.error('Error inspecting database:', error);
    throw error;
  }
}

async function fixSchemaIssues(dbInfo: DatabaseInfo) {
  const client = await pool.connect();
  
  try {
    console.log('Starting schema fixes...');
    await client.query('BEGIN');
    
    // --- PART 1: Check and create enums if they don't exist ---
    const enumTypes = {
      'question_type': [
        'MultipleChoice',
        'Matching',
        'MultipleCorrectStatements',
        'AssertionReason',
        'DiagramBased',
        'SequenceOrdering'
      ],
      'question_source_type': [
        'PreviousYear',
        'AI_Generated',
        'Other'
      ],
      'difficulty_level': [
        'easy',
        'medium',
        'hard'
      ]
    };
    
    // Create enums if they don't exist
    const existingEnums = dbInfo.enums.map((e: EnumType) => e.type_name);
    
    for (const [enumName, enumValues] of Object.entries(enumTypes)) {
      if (!existingEnums.includes(enumName)) {
        console.log(`Creating ${enumName} enum...`);
        await client.query(`
          CREATE TYPE ${enumName} AS ENUM (${enumValues.map(v => `'${v}'`).join(', ')});
        `);
        console.log(`Created ${enumName} enum`);
      } else {
        console.log(`${enumName} enum already exists`);
      }
    }
    
    // --- PART 2: Fix column types if the table exists ---
    if (dbInfo.tableExists) {
      console.log('Fixing column types in questions table...');
      
      // Check each enum column and fix if necessary
      const enumColumns = [
        { name: 'question_type', enumType: 'question_type', defaultValue: 'MultipleChoice' },
        { name: 'source_type', enumType: 'question_source_type', defaultValue: 'Other' },
        { name: 'difficulty_level', enumType: 'difficulty_level', defaultValue: 'medium' }
      ];
      
      for (const col of enumColumns) {
        const colInfoQuery = await client.query(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = 'questions' AND column_name = $1
        `, [col.name]);
        
        if (colInfoQuery.rows.length > 0) {
          const currentType = colInfoQuery.rows[0].data_type;
          console.log(`Column ${col.name} current type: ${currentType}`);
          
          if (currentType.toLowerCase() !== 'user-defined' && currentType.toLowerCase() !== col.enumType) {
            console.log(`Fixing ${col.name} column...`);
            
            // Create temp column
            await client.query(`
              ALTER TABLE questions ADD COLUMN ${col.name}_new ${col.enumType};
            `);
            
            try {
              // Try to transfer data
              await client.query(`
                UPDATE questions 
                SET ${col.name}_new = ${col.name}::text::${col.enumType};
              `);
            } catch (castError) {
              console.error(`Error casting ${col.name} data:`, castError);
              // Set default value
              await client.query(`
                UPDATE questions 
                SET ${col.name}_new = '${col.defaultValue}'::${col.enumType};
              `);
            }
            
            // Replace column
            await client.query(`
              ALTER TABLE questions DROP COLUMN ${col.name};
              ALTER TABLE questions RENAME COLUMN ${col.name}_new TO ${col.name};
            `);
            
            console.log(`Fixed ${col.name} column`);
          }
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('Schema fixes completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function runDrizzleMigrations() {
  try {
    console.log('Running Drizzle migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Drizzle migrations completed successfully');
  } catch (error) {
    console.error('Error during Drizzle migrations:', error);
    throw error;
  }
}

async function runFullMigration() {
  try {
    // Step 1: Inspect database
    const dbInfo = await inspectDatabase();
    
    // Step 2: Fix schema issues
    await fixSchemaIssues(dbInfo);
    
    // Step 3: Run Drizzle migrations
    await runDrizzleMigrations();
    
    console.log('Full migration process completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
runFullMigration().catch(console.error);