/**
 * Script to apply database migration for topic indexes
 * Run with: npx tsx scripts/apply-migration.ts
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  console.log('🚀 Starting migration: Add topics indexes...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../drizzle/0008_add_topics_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon to execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');

      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

      try {
        await db.execute(sql.raw(statement));
        console.log(`✓ Success\n`);
      } catch (error) {
        console.error(`✗ Failed: ${error}\n`);
        throw error;
      }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Verifying indexes...');

    // Verify that indexes were created
    const indexCheck = await db.execute(sql`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'topics'
      AND schemaname = 'public'
      ORDER BY indexname;
    `);

    console.log('\n📋 Current indexes on topics table:');
    console.table(indexCheck.rows);

    // Get table statistics
    const statsCheck = await db.execute(sql`
      SELECT
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE relname = 'topics';
    `);

    console.log('\n📈 Table statistics:');
    console.table(statsCheck.rows);

    console.log('\n🎉 All done! Your chemistry page queries should be significantly faster now.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the migration
applyMigration();
