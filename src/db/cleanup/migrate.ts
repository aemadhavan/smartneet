import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const execPromise = promisify(exec);

async function runMigration() {
  try {
    // Use path.join to ensure correct directory paths
    const dbDir = path.join(__dirname);
    
    // Step 1: Inspect the current database state
    console.log('Inspecting current database state...');
    await execPromise(`ts-node ${path.join(dbDir, 'inspect-db.ts')}`);
    
    // Step 2: Run the comprehensive migration
    console.log('\nRunning comprehensive migration...');
    await execPromise(`ts-node ${path.join(dbDir, 'comprehensive-migration.ts')}`);
    
    console.log('\nMigration process completed successfully');
  } catch (error) {
    console.error('Migration process failed:', error);
    console.error(error);
  }
}

runMigration().catch(error => {
  console.error('Unhandled error in migration:', error);
});