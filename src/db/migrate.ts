// src/db/migrate.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command: string) {
  console.log(`Running: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    return false;
  }
}

async function main() {
  console.log('Starting migration process...');
  
  // Step 1: Run custom migration to handle enums and sequence tables
  console.log('\n--- Step 1: Running custom migration ---');
  if (!await runCommand('tsx src/db/custom-migrate.ts')) {
    console.error('Custom migration failed, stopping process.');
    process.exit(1);
  }
  
  // Step 2: Generate migration files from schema
  console.log('\n--- Step 2: Generating migration files ---');
  if (!await runCommand('npx drizzle-kit generate')) {
    console.error('Migration generation failed, stopping process.');
    process.exit(1);
  }
  
  // Step 3: Record all existing migrations in the database
  // This will mark them as applied without actually running the SQL
  console.log('\n--- Step 3: Recording migrations ---');
  if (!await runCommand('tsx src/db/record-migrations.ts')) {
    console.error('Migration recording failed.');
    process.exit(1);
  }
  
  // Step 4: Verify the schema
  console.log('\n--- Step 4: Verifying schema ---');
  if (!await runCommand('tsx src/db/verify-schema.ts')) {
    console.error('Schema verification failed.');
    process.exit(1);
  }
  
  console.log('\n✅ Migration process completed successfully!');
}

main().catch(error => {
  console.error('Migration process failed:', error);
  process.exit(1);
});