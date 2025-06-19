// scripts/fix-practice-issues.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { db } from '@/db';
import { 
  practice_sessions, 
  user_subscriptions, 
  subscription_plans,
  question_attempts,
  session_questions
} from '@/db/schema';
import { eq, and, sql, isNull, inArray } from 'drizzle-orm';
import { cache } from '@/lib/cache';

interface FixOperation {
  category: string;
  operation: string;
  affected_count: number;
  details: any;
  success: boolean;
  error?: string;
}

export class PracticeModuleFixer {
  private fixes: FixOperation[] = [];

  async runAllFixes(): Promise<FixOperation[]> {
    console.log('🔧 Starting Practice Module Fixes...');
    
    await this.cleanupGhostSessions();
    await this.fixTestLimitCounts();
    await this.createMissingSubscriptions();
    await this.fixSubscriptionStatuses();
    await this.cleanupOrphanedData();
    await this.resetNewUserLimits();
    await this.fixSessionQuestionCounts();
    await this.invalidateStaleCache();
    await this.completeAbandonedSessions();
    
    return this.fixes;
  }

  // 1. Clean up ghost sessions (sessions with 0 questions)
  async cleanupGhostSessions() {
    console.log('👻 Cleaning up ghost sessions...');
    
    try {
      // Find ghost sessions
      const ghostSessions = await db
        .select({ 
          session_id: practice_sessions.session_id,
          user_id: practice_sessions.user_id 
        })
        .from(practice_sessions)
        .where(
          and(
            eq(practice_sessions.total_questions, 0),
            eq(practice_sessions.questions_attempted, 0),
            isNull(practice_sessions.duration_minutes)
          )
        );

      if (ghostSessions.length > 0) {
        // Delete in batches to avoid timeout
        const batchSize = 50;
        let deletedCount = 0;
        
        for (let i = 0; i < ghostSessions.length; i += batchSize) {
          const batch = ghostSessions.slice(i, i + batchSize);
          const sessionIds = batch.map(s => s.session_id);
          
          await db.transaction(async (tx) => {
            // Delete related records first
            await tx.delete(session_questions)
              .where(inArray(session_questions.session_id, sessionIds));
            
            await tx.delete(question_attempts)
              .where(inArray(question_attempts.session_id, sessionIds));
            
            // Delete sessions
            await tx.delete(practice_sessions)
              .where(inArray(practice_sessions.session_id, sessionIds));
          });
          
          deletedCount += batch.length;
        }

        this.fixes.push({
          category: 'Session Cleanup',
          operation: 'Delete ghost sessions',
          affected_count: deletedCount,
          details: { total_found: ghostSessions.length },
          success: true
        });
      }
    } catch (error) {
      this.fixes.push({
        category: 'Session Cleanup',
        operation: 'Delete ghost sessions',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 2. Fix test limit counts by recalculating from actual completed sessions
  async fixTestLimitCounts() {
    console.log('📊 Fixing test limit counts...');
    
    try {
      // Get all users and recalculate their daily test counts
      const result = await db.execute(sql`
        WITH daily_counts AS (
          SELECT 
            ps.user_id,
            COUNT(CASE WHEN ps.is_completed = true AND DATE(ps.start_time) = CURRENT_DATE THEN 1 END) as actual_tests_today,
            COUNT(CASE WHEN ps.is_completed = true THEN 1 END) as actual_tests_total
          FROM practice_sessions ps
          GROUP BY ps.user_id
        )
        UPDATE user_subscriptions us
        SET 
          tests_used_today = COALESCE(dc.actual_tests_today, 0),
          tests_used_total = COALESCE(dc.actual_tests_total, 0),
          updated_at = NOW()
        FROM daily_counts dc
        WHERE us.user_id = dc.user_id
          AND (
            us.tests_used_today != COALESCE(dc.actual_tests_today, 0) OR
            us.tests_used_total != COALESCE(dc.actual_tests_total, 0)
          )
        RETURNING us.user_id
      `);

      this.fixes.push({
        category: 'Test Limits',
        operation: 'Recalculate test counts',
        affected_count: result.rowCount || 0,
        details: {},
        success: true
      });
    } catch (error) {
      this.fixes.push({
        category: 'Test Limits',
        operation: 'Recalculate test counts',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 3. Create missing subscriptions for users who have sessions but no subscription
  async createMissingSubscriptions() {
    console.log('💳 Creating missing subscriptions...');
    
    try {
      // Find users without subscriptions
      const usersWithoutSubs = await db.execute(sql`
        SELECT DISTINCT ps.user_id
        FROM practice_sessions ps
        LEFT JOIN user_subscriptions us ON ps.user_id = us.user_id
        WHERE us.user_id IS NULL
      `);

      if (usersWithoutSubs.rowCount && usersWithoutSubs.rowCount > 0) {
        // Get the free plan
        const freePlans = await db
          .select()
          .from(subscription_plans)
          .where(eq(subscription_plans.plan_code, 'free'))
          .limit(1);

        if (freePlans.length === 0) {
          throw new Error('Free plan not found in database');
        }

        const freePlan = freePlans[0];
        const now = new Date();
        const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

        // Create subscriptions for each user
        for (const row of usersWithoutSubs.rows) {
          await db.insert(user_subscriptions).values({
            user_id: row.user_id as string,
            plan_id: freePlan.plan_id,
            status: 'active',
            current_period_start: now,
            current_period_end: endDate,
            tests_used_today: 0,
            tests_used_total: 0,
            stripe_subscription_id: null,
            stripe_customer_id: null,
            cancel_at_period_end: false,
            canceled_at: null,
            trial_end: null,
            last_test_date: null,
            metadata: null
          });
        }

        this.fixes.push({
          category: 'Subscriptions',
          operation: 'Create missing subscriptions',
          affected_count: usersWithoutSubs.rowCount,
          details: { plan_used: freePlan.plan_name },
          success: true
        });
      }
    } catch (error) {
      this.fixes.push({
        category: 'Subscriptions',
        operation: 'Create missing subscriptions',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 4. Fix subscription statuses (expired but still active)
  async fixSubscriptionStatuses() {
    console.log('🔄 Fixing subscription statuses...');
    
    try {
      const result = await db
        .update(user_subscriptions)
        .set({
          status: 'canceled',
          updated_at: new Date()
        })
        .where(
          and(
            eq(user_subscriptions.status, 'active'),
            sql`${user_subscriptions.current_period_end} < NOW()`
          )
        )
        .returning({ user_id: user_subscriptions.user_id });

      this.fixes.push({
        category: 'Subscriptions',
        operation: 'Fix expired subscription statuses',
        affected_count: result.length,
        details: {},
        success: true
      });
    } catch (error) {
      this.fixes.push({
        category: 'Subscriptions',
        operation: 'Fix expired subscription statuses',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 5. Clean up orphaned data
  async cleanupOrphanedData() {
    console.log('🗑️ Cleaning up orphaned data...');
    
    try {
      // Clean up orphaned session questions
      const orphanedQuestions = await db.execute(sql`
        DELETE FROM session_questions
        WHERE session_id NOT IN (
          SELECT session_id FROM practice_sessions
        )
      `);

      // Clean up orphaned question attempts
      const orphanedAttempts = await db.execute(sql`
        DELETE FROM question_attempts
        WHERE session_id IS NOT NULL 
          AND session_id NOT IN (
            SELECT session_id FROM practice_sessions
          )
      `);

      this.fixes.push({
        category: 'Data Cleanup',
        operation: 'Remove orphaned records',
        affected_count: (orphanedQuestions.rowCount || 0) + (orphanedAttempts.rowCount || 0),
        details: {
          orphaned_questions: orphanedQuestions.rowCount || 0,
          orphaned_attempts: orphanedAttempts.rowCount || 0
        },
        success: true
      });
    } catch (error) {
      this.fixes.push({
        category: 'Data Cleanup',
        operation: 'Remove orphaned records',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 6. Reset test limits for new users who shouldn't be at limit
  async resetNewUserLimits() {
    console.log('🆕 Resetting new user limits...');
    
    try {
      const result = await db.execute(sql`
        UPDATE user_subscriptions
        SET 
          tests_used_today = 0,
          tests_used_total = 0,
          last_test_date = NULL,
          updated_at = NOW()
        WHERE created_at > NOW() - INTERVAL '1 hour'
          AND tests_used_today > 0
          AND (
            SELECT COUNT(*) 
            FROM practice_sessions ps 
            WHERE ps.user_id = user_subscriptions.user_id 
              AND ps.is_completed = true
          ) = 0
        RETURNING user_id
      `);

      this.fixes.push({
        category: 'Test Limits',
        operation: 'Reset new user limits',
        affected_count: result.rowCount || 0,
        details: { criteria: 'New users with no completed sessions but high test count' },
        success: true
      });
    } catch (error) {
      this.fixes.push({
        category: 'Test Limits',
        operation: 'Reset new user limits',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 7. Fix session question counts
  async fixSessionQuestionCounts() {
    console.log('🔢 Fixing session question counts...');
    
    try {
      const result = await db.execute(sql`
        UPDATE practice_sessions ps
        SET 
          total_questions = subquery.actual_count,
          updated_at = NOW()
        FROM (
          SELECT 
            session_id,
            COUNT(*) as actual_count
          FROM session_questions
          GROUP BY session_id
        ) subquery
        WHERE ps.session_id = subquery.session_id
          AND ps.total_questions != subquery.actual_count
        RETURNING ps.session_id
      `);

      this.fixes.push({
        category: 'Session Data',
        operation: 'Fix question counts',
        affected_count: result.rowCount || 0,
        details: {},
        success: true
      });
    } catch (error) {
      this.fixes.push({
        category: 'Session Data',
        operation: 'Fix question counts',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 8. Invalidate stale cache entries
  async invalidateStaleCache() {
    console.log('🗄️ Invalidating stale cache...');
    
    try {
      let invalidatedCount = 0;
      
      // Get sample of users to clear cache for
      const users = await db
        .select({ user_id: user_subscriptions.user_id })
        .from(user_subscriptions)
        .limit(100);

      for (const user of users) {
        try {
          // Clear various cache keys
          const cacheKeys = [
            `user:${user.user_id}:subscription`,
            `user:${user.user_id}:test-limits`,
            `api:practice-sessions:user:${user.user_id}:*`
          ];

          for (const key of cacheKeys) {
            await cache.delete(key);
            if (key.includes('*')) {
              await cache.deletePattern(key);
            }
          }
          invalidatedCount++;
        } catch (cacheError) {
          // Continue with other users if one fails
          console.warn(`Failed to clear cache for user ${user.user_id}:`, cacheError);
        }
      }

      this.fixes.push({
        category: 'Cache Management',
        operation: 'Invalidate stale cache',
        affected_count: invalidatedCount,
        details: { users_processed: users.length },
        success: true
      });
    } catch (error) {
      this.fixes.push({
        category: 'Cache Management',
        operation: 'Invalidate stale cache',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 9. Complete abandoned sessions (older than 2 hours)
  async completeAbandonedSessions() {
    console.log('⏰ Completing abandoned sessions...');
    
    try {
      const result = await db
        .update(practice_sessions)
        .set({
          is_completed: true,
          end_time: new Date(),
          updated_at: new Date()
        })
        .where(
          and(
            eq(practice_sessions.is_completed, false),
            sql`${practice_sessions.start_time} < NOW() - INTERVAL '2 hours'`,
            sql`${practice_sessions.total_questions} > 0`
          )
        )
        .returning({ session_id: practice_sessions.session_id });

      this.fixes.push({
        category: 'Session Management',
        operation: 'Complete abandoned sessions',
        affected_count: result.length,
        details: { criteria: 'Sessions older than 2 hours' },
        success: true
      });
    } catch (error) {
      this.fixes.push({
        category: 'Session Management',
        operation: 'Complete abandoned sessions',
        affected_count: 0,
        details: {},
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Generate fix report
  generateReport(): string {
    let report = '\n🔧 PRACTICE MODULE FIX REPORT\n';
    report += '===============================\n\n';

    const successCount = this.fixes.filter(f => f.success).length;
    const failureCount = this.fixes.filter(f => !f.success).length;
    const totalAffected = this.fixes.reduce((sum, f) => sum + f.affected_count, 0);

    report += `📊 SUMMARY:\n`;
    report += `   ✅ Successful operations: ${successCount}\n`;
    report += `   ❌ Failed operations: ${failureCount}\n`;
    report += `   📈 Total records affected: ${totalAffected}\n\n`;

    for (const fix of this.fixes) {
      const status = fix.success ? '✅' : '❌';
      report += `${status} ${fix.category}: ${fix.operation}\n`;
      report += `   Affected: ${fix.affected_count} records\n`;
      
      if (fix.error) {
        report += `   Error: ${fix.error}\n`;
      }
      
      if (Object.keys(fix.details).length > 0) {
        report += `   Details: ${JSON.stringify(fix.details, null, 2)}\n`;
      }
      report += '\n';
    }

    return report;
  }
}

// Export for use in scripts or API endpoints
export async function runFixes() {
  const fixer = new PracticeModuleFixer();
  const results = await fixer.runAllFixes();
  const report = fixer.generateReport();
  
  console.log(report);
  return { results, report };
}

// CLI usage
if (require.main === module) {
  runFixes().catch(console.error);
}