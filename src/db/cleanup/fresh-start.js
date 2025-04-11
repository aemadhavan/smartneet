const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

async function runWithOutput(command) {
  console.log(`\n> ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

async function freshStart() {
  console.log('=== STARTING FRESH DATABASE SETUP ===');
  
  // 1. Clean up existing drizzle directory if it exists
  try {
    const drizzleDir = path.join(process.cwd(), 'drizzle');
    if (fs.existsSync(drizzleDir)) {
      console.log('Removing existing drizzle directory...');
      fs.rmSync(drizzleDir, { recursive: true, force: true });
      console.log('Removed existing drizzle directory');
    }
  } catch (error) {
    console.error('Error cleaning up drizzle directory:', error);
  }
  
  // 2. Reset the database
  console.log('\n=== RESETTING DATABASE ===');
  const resetSuccess = await runWithOutput('node reset-and-recreate.js');
  if (!resetSuccess) {
    console.error('Database reset failed. Stopping process.');
    return;
  }
  
  // 3. Generate fresh migrations
  console.log('\n=== GENERATING FRESH MIGRATIONS ===');
  const generateSuccess = await runWithOutput('npx drizzle-kit generate');
  if (!generateSuccess) {
    console.error('Migration generation failed. Stopping process.');
    return;
  }
  
  // 4. Apply fresh migrations
  console.log('\n=== APPLYING FRESH MIGRATIONS ===');
  const migrateSuccess = await runWithOutput('npx drizzle-kit push');
  if (!migrateSuccess) {
    console.error('Migration push failed.');
    return;
  }
  
  // 5. Open Drizzle Studio (optional)
  console.log('\n=== PROCESS COMPLETED SUCCESSFULLY ===');
  console.log('\nWould you like to open Drizzle Studio to view your database? (Y/n)');
  
  process.stdin.once('data', async (data) => {
    const input = data.toString().trim().toLowerCase();
    if (input === 'y' || input === '') {
      console.log('\n=== OPENING DRIZZLE STUDIO ===');
      await runWithOutput('npx drizzle-kit studio');
    } else {
      console.log('\nSkipping Drizzle Studio. Your database is ready to use!');
      process.exit(0);
    }
  });
}

// Run the fresh start process
freshStart().catch(error => {
  console.error('Unhandled error during fresh start:', error);
  process.exit(1);
});