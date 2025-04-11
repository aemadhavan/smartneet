const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
require('dotenv').config();

// Load from .env.local if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  console.log('No .env.local file found');
}

/**
 * Creates a pg Pool configured for Xata hosted PostgreSQL
 * @returns {Pool} Postgres connection pool
 */
function createXataPool() {
  // First check if we have the direct Xata URL
  const xataUrl = process.env.XATA_DATABASE_URL;
  
  if (!xataUrl) {
    console.error('Error: XATA_DATABASE_URL is not defined in your .env.local file');
    process.exit(1);
  }
  
  console.log('Using Xata PostgreSQL connection');
  
  // Configure SSL for Xata
  const ssl = { rejectUnauthorized: true };
  
  // Create pool with SSL enabled
  const pool = new Pool({
    connectionString: xataUrl,
    ssl: ssl
  });
  
  return pool;
}

// Export the pool and drizzle instance
const pool = createXataPool();
const db = drizzle(pool);

module.exports = {
  pool,
  db
};