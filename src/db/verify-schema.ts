// src/db/verify-schema.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local instead of .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifySchema() {
  // Connect directly to PostgreSQL
  const client = new Client({
    connectionString: process.env.XATA_DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
    }
  });
  
  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    // Check enum types
    console.log('\n==== Enum Types ====');
    const enumTypes = ['difficulty_level', 'question_type', 'question_source_type'];
    
    for (const enumType of enumTypes) {
      const { rows } = await client.query(`
        SELECT e.enumlabel 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = $1
        ORDER BY e.enumsortorder
      `, [enumType]);
      
      if (rows.length > 0) {
        console.log(`✅ ${enumType}: ${rows.map(r => r.enumlabel).join(', ')}`);
      } else {
        console.log(`❌ ${enumType}: Not found`);
      }
    }
    
    // Check tables
    console.log('\n==== Tables ====');
    const tables = [
      'subjects', 'topics', 'subtopics', 'exam_years', 'question_papers', 
      'questions', 'tags', 'question_tags', 'sequence_ordering_questions', 'sequence_items'
    ];
    
    for (const table of tables) {
      const { rows } = await client.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);
      
      if (rows.length > 0) {
        // Count rows in table
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = countResult.rows[0].count;
        console.log(`✅ ${table}: Table exists with ${count} rows`);
      } else {
        console.log(`❌ ${table}: Table not found`);
      }
    }
    
    // Check special tables (sequence tables, etc.)
    console.log('\n==== Special Table Relationships ====');
    
    // Check if there are sequence items
    const { rows: sequenceItems } = await client.query(`
      SELECT COUNT(*) FROM sequence_items
    `);
    
    console.log(`Sequence Items: ${sequenceItems[0].count}`);
    
    console.log('\n==== Migrations ====');
    // Show migrations applied
    const { rows: migrations } = await client.query(`
      SELECT hash, created_at FROM drizzle_migrations
      ORDER BY created_at
    `);
    
    if (migrations.length > 0) {
      console.log(`Applied migrations: ${migrations.length}`);
      migrations.forEach((m, i) => {
        console.log(`  ${i+1}. ${m.hash} - ${m.created_at}`);
      });
    } else {
      console.log('No migrations recorded in drizzle_migrations table');
    }
    
    console.log('\nSchema verification completed.');
  } catch (error) {
    console.error('Schema verification failed:', error);
  } finally {
    await client.end();
  }
}

verifySchema().catch(error => {
  console.error('Verification process failed:', error);
  process.exit(1);
});