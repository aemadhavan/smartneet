import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function inspectDatabase() {
  try {
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
    
    // Check table structure for questions table
    const tableStructureQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'questions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCurrent Questions Table Structure:');
    console.log(JSON.stringify(tableStructureQuery.rows, null, 2));
    
    // Write to a file for easier inspection
    fs.writeFileSync('db-inspection.json', JSON.stringify({
      enums: enumTypesQuery.rows,
      questions: tableStructureQuery.rows
    }, null, 2));
    
    console.log('\nDatabase inspection complete. Results saved to db-inspection.json');
    
  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    await pool.end();
  }
}

inspectDatabase().catch(console.error);