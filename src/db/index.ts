// src/db/index.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';  // Import all schema tables and relations

// Make sure the environment variable exists
if (!process.env.XATA_DATABASE_URL) {
  console.error('XATA_DATABASE_URL environment variable is not defined');
  throw new Error('Database connection string is not defined');
}

// Define a type for database errors
interface DatabaseError extends Error {
  code?: string;
}

// Create a singleton pool that can be reused across serverless function invocations
let poolInstance: Pool | null = null;

function getPool() {
  if (!poolInstance) {
    // Configure the pool with limits appropriate for serverless environment
    poolInstance = new Pool({
      connectionString: process.env.XATA_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // This might be needed for Xata connections
      },
      max: 10, // Limit maximum connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 5000, // Timeout after 5 seconds when trying to connect
      allowExitOnIdle: true // Allow the process to exit if pool is idle
    });

    // Add error handling
    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Don't exit in production - just log the error
      if (process.env.NODE_ENV !== 'production') {
        process.exit(-1);
      }
    });
  }
  return poolInstance;
}

// Get the pool
const pool = getPool();

// Export the drizzle instance with the pool AND schema
export const db = drizzle(pool, { schema });  // Pass schema here

// Add a helper function for retrying operations with backoff
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: DatabaseError | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      // Cast error to DatabaseError type to check for code property
      const dbError = error as DatabaseError;
      
      // Retry for database connection errors
      if (dbError.code === 'XATA_CONCURRENCY_LIMIT' || 
          dbError.code === '53300' ||  // Too many connections
          dbError.code === '08006' ||  // Connection terminated
          dbError.code === '08001') {  // Unable to establish connection
        lastError = dbError;
        // Exponential backoff: 1s, 2s, 4s, ...
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Connection limit exceeded, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For other errors, throw immediately
        throw error;
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Operation failed after maximum retries');
}

// Optional: Test query to verify connection with retry
async function testConnection() {
  try {
    await withRetry(async () => {
      const client = await pool.connect();
      try {
        const res = await client.query('SELECT NOW()');
        console.log('Database connected successfully:', res.rows[0].now);
        return res;
      } finally {
        client.release();
      }
    });
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

// Run the test connection
testConnection();

// Re-export schema
export * from './schema';