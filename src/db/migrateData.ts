// src/db/exportTables.ts
import dotenv from 'dotenv';
import path from 'path';
//import fs from 'fs';
import { Client } from 'pg';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listTables() {
  // Get PostgreSQL connection string from environment
  const dbUrl = process.env.XATA_DATABASE_URL;
  
  if (!dbUrl) {
    console.error("Error: XATA_DATABASE_URL is not set in .env.local");
    process.exit(1);
  }
  
  console.log("Connecting to database...");
  
  const client = new Client({
    connectionString: dbUrl
  });
  
  try {
    await client.connect();
    console.log("Connected successfully!");
    
    // Get a list of tables in the database
    const tablesQuery = `
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `;
    
    const result = await client.query(tablesQuery);
    
    console.log("Available tables:");
    result.rows.forEach(row => {
      console.log(`${row.table_schema}.${row.table_name}`);
    });
    
    // Let's also check if we have access to the questions table
    try {
      const countQuery = "SELECT COUNT(*) FROM questions";
      const countResult = await client.query(countQuery);
      console.log(`Total questions count: ${countResult.rows[0].count}`);
    } catch (err:unknown) {
      console.log("Could not query questions table:", err);
    }
    
  } catch (error) {
    console.error("Database operation failed:", error);
  } finally {
    await client.end();
  }
}

listTables().catch(console.error);