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
      connectionString: process.env.XATA_DATABASE_URL?.replace('sslmode=require', 'sslmode=verify-full'),
      ssl: true,
      max: 5, // Reduced for serverless - prevents connection exhaustion
      min: 0, // No persistent connections - better for serverless cold starts
      idleTimeoutMillis: 30000, // Release idle connections sooner to prevent stale connections
      connectionTimeoutMillis: 20000, // Increased timeout for database connection establishment
      allowExitOnIdle: true // Allow the process to exit if pool is idle
    });

    // Add error handling for idle client errors
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
      const errorMessage = dbError.message || String(error);
      const isRetryableError =
        dbError.code === 'ECONNRESET' ||  // Connection reset by peer
        dbError.code === 'ENOTFOUND' ||   // DNS lookup failed
        dbError.code === 'ETIMEDOUT' ||   // Connection timeout
        dbError.code === 'ECONNREFUSED' || // Connection refused
        dbError.code === 'XATA_CONCURRENCY_LIMIT' ||
        dbError.code === '53300' ||  // Too many connections
        dbError.code === '08006' ||  // Connection terminated
        dbError.code === '08001' ||  // Unable to establish connection
        errorMessage.includes('unable to connect to the appropriate database') ||
        errorMessage.includes('connection terminated') ||
        errorMessage.includes('connection timeout') ||  // Added for timeout errors
        errorMessage.includes('too many connections') ||
        errorMessage.includes('connection failed') ||
        errorMessage.includes('ECONNRESET');

      if (isRetryableError) {
        lastError = dbError;
        // Exponential backoff: 1s, 2s, 4s, ...
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Database connectivity issue, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, errorMessage);
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
// Export this function so it can be called manually if needed
export async function testConnection() {
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

// Only test connection if explicitly enabled via environment variable
// This prevents connection churn on every module load
if (process.env.DB_TEST_CONNECTION === 'true') {
  testConnection();
}

// Re-export schema
export * from './schema';