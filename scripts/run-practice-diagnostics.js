#!/usr/bin/env node

// scripts/run-practice-diagnostics.js
// Simple script to run practice module diagnostics

const https = require('https');
const http = require('http');

async function runDiagnostics() {
  console.log('🔍 Running Practice Module Diagnostics...\n');
  
  try {
    // Try to make request to the diagnostics API
    const response = await makeRequest('GET', '/api/admin/diagnostics/practice');
    
    if (response.success) {
      console.log('✅ Diagnostics completed successfully!\n');
      console.log('📊 SUMMARY:');
      console.log(`   🔴 Critical Issues: ${response.summary.critical_issues}`);
      console.log(`   🟠 High Priority: ${response.summary.high_priority}`);
      console.log(`   🟡 Medium Priority: ${response.summary.medium_priority}`);
      console.log(`   🟢 Low Priority: ${response.summary.low_priority}`);
      console.log(`   📝 Total Issues: ${response.summary.total_issues}\n`);
      
      if (response.summary.total_issues > 0) {
        console.log('📋 DETAILED REPORT:');
        console.log(response.report);
        
        console.log('\n🔧 To fix these issues, run:');
        console.log('npm run fix:practice-issues');
      } else {
        console.log('🎉 No issues found! Your practice module is healthy.');
      }
    } else {
      console.error('❌ Diagnostics failed:', response.error);
    }
  } catch (error) {
    console.error('❌ Error running diagnostics:', error.message);
    console.log('\n💡 Fallback: Running direct database diagnostics...');
    
    // Fallback to direct execution using tsx
    try {
      const { spawn } = require('child_process');
      const path = require('path');
      
      console.log('🔄 Running direct TypeScript diagnostics...');
      
      const tsx = spawn('npx', ['tsx', path.join(__dirname, 'practice-module-diagnostics.ts')], {
        stdio: 'inherit',
        cwd: path.dirname(__dirname)
      });

      tsx.on('close', (code) => {
        if (code !== 0) {
          console.error(`❌ Direct diagnostics failed with code ${code}`);
          console.log('\n🔧 Manual steps to investigate:');
          console.log('1. Check database connectivity (XATA_DATABASE_URL)');
          console.log('2. Verify Redis/cache service');
          console.log('3. Check for ghost sessions in practice_sessions table');
          console.log('4. Verify subscription counts in user_subscriptions table');
          console.log('5. Ensure environment variables are loaded (.env file)');
        }
      });

      tsx.on('error', (tsxError) => {
        console.error('❌ Failed to run tsx:', tsxError.message);
        console.log('\n🔧 Alternative: Run diagnostics manually:');
        console.log('npx tsx scripts/practice-module-diagnostics.ts');
      });
      
    } catch (directError) {
      console.error('❌ Direct diagnostics setup failed:', directError.message);
      console.log('\n🔧 Manual steps to investigate:');
      console.log('1. Check database connectivity (XATA_DATABASE_URL)');
      console.log('2. Verify Redis/cache service');
      console.log('3. Check for ghost sessions in practice_sessions table');
      console.log('4. Verify subscription counts in user_subscriptions table');
      console.log('5. Ensure environment variables are loaded (.env file)');
    }
  }
}

async function runFixes(dryRun = true) {
  console.log(`🔧 ${dryRun ? 'Dry run' : 'Executing'} Practice Module Fixes...\n`);
  
  try {
    const response = await makeRequest('POST', '/api/admin/diagnostics/practice', {
      action: 'fix-all',
      dryRun
    });
    
    if (response.success) {
      console.log('✅ Fix operation completed!\n');
      
      if (dryRun) {
        console.log('📋 DRY RUN RESULTS (no changes made):');
        console.log(`   📝 Issues found: ${response.issues_found}`);
      } else {
        console.log('🔧 FIX RESULTS:');
        console.log(`   ✅ Successful operations: ${response.successful_operations}`);
        console.log(`   ❌ Failed operations: ${response.failed_operations}`);
        console.log(`   📈 Total records affected: ${response.total_records_affected}`);
      }
      
      console.log('\n📊 DETAILED REPORT:');
      console.log(response.report);
    } else {
      console.error('❌ Fix operation failed:', response.error);
    }
  } catch (error) {
    console.error('❌ Error running fixes:', error.message);
  }
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000, // Adjust port if needed
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed
        // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'diagnose':
      await runDiagnostics();
      break;
    case 'fix':
      const dryRun = !args.includes('--execute');
      await runFixes(dryRun);
      break;
    case 'fix-execute':
      await runFixes(false);
      break;
    default:
      console.log('🏥 Practice Module Health Check\n');
      console.log('Usage:');
      console.log('  node scripts/run-practice-diagnostics.js diagnose     # Run diagnostics');
      console.log('  node scripts/run-practice-diagnostics.js fix          # Dry run fixes');
      console.log('  node scripts/run-practice-diagnostics.js fix-execute  # Execute fixes');
      console.log('\nOr use npm scripts:');
      console.log('  npm run diagnose:practice');
      console.log('  npm run fix:practice-issues');
      console.log('  npm run fix:practice-issues:execute');
  }
}

main().catch(console.error);