// src/db/index.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Make sure the environment variable exists
if (!process.env.XATA_DATABASE_URL) {
  console.error('XATA_DATABASE_URL environment variable is not defined');
  throw new Error('Database connection string is not defined');
}

// Create a PostgreSQL connection pool with SSL required for Xata
const pool = new Pool({
  connectionString: process.env.XATA_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This might be needed for Xata connections
  }
});

// Test the connection and log any errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export the drizzle instance with the pool
export const db = drizzle(pool);

// Optional: Test query to verify connection
async function testConnection() {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW()');
      console.log('Database connected successfully:', res.rows[0].now);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

// Run the test connection
testConnection();