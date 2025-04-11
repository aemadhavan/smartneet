const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { pool, db } = require('./xata-connection');

async function resetAndRecreateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting schema reset for Xata PostgreSQL database...');
    
    // 1. Drop existing tables but keep the schema (Xata manages schemas)
    console.log('Dropping existing tables...');
    
    // Get all tables in the public schema
    const tablesQuery = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public';
    `);
    
    const tables = tablesQuery.rows.map(row => row.tablename);
    
    if (tables.length > 0) {
      // Drop all tables (excluding Xata system tables)
      const filteredTables = tables.filter(table => !table.startsWith('_xata_'));
      
      if (filteredTables.length > 0) {
        await client.query('BEGIN');
        console.log(`Found ${filteredTables.length} tables to drop: ${filteredTables.join(', ')}`);
        
        for (const table of filteredTables) {
          console.log(`Dropping table: ${table}`);
          await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        }
        
        await client.query('COMMIT');
      } else {
        console.log('No user tables found to drop');
      }
    } else {
      console.log('No tables found in the public schema');
    }
    
    // 2. Drop existing types
    console.log('Dropping existing custom types...');
    
    const typesQuery = await client.query(`
      SELECT typname
      FROM pg_type
      JOIN pg_catalog.pg_namespace n ON n.oid = typnamespace
      WHERE typtype = 'e' AND n.nspname = 'public';
    `);
    
    const types = typesQuery.rows.map(row => row.typname);
    
    if (types.length > 0) {
      await client.query('BEGIN');
      console.log(`Found ${types.length} types to drop: ${types.join(', ')}`);
      
      for (const type of types) {
        console.log(`Dropping type: ${type}`);
        await client.query(`DROP TYPE IF EXISTS "${type}" CASCADE`);
      }
      
      await client.query('COMMIT');
    } else {
      console.log('No custom types found to drop');
    }
    
    // 3. Remove Drizzle migration metadata if it exists
    await client.query('BEGIN');
    try {
      console.log('Cleaning up Drizzle migration metadata...');
      await client.query(`DROP TABLE IF EXISTS "__drizzle_migrations"`);
      console.log('Drizzle migration metadata cleaned');
    } catch (err) {
      console.log('No Drizzle migration metadata to clean');
    }
    await client.query('COMMIT');
    
    // 4. Run migrations
    console.log('\nRunning Drizzle migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('\n✅ Database schema recreated successfully');
    console.log('\nNext steps:');
    console.log('1. Run `npx drizzle-kit studio` to view your database schema');
    console.log('2. Run your application to start using the fresh database');
    
  } catch (error) {
    console.error('Error during database reset and recreation:', error);
    
    if (error.message.includes('permission denied')) {
      console.log('\nNOTE: You may have limited permissions on the Xata hosted database.');
      console.log('If you cannot reset the database, consider:');
      console.log('1. Creating a new branch in Xata dashboard');
      console.log('2. Using a local PostgreSQL instance for development');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the reset and recreation
resetAndRecreateDatabase().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});