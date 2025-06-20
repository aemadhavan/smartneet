// scripts/practice-module-diagnostics.ts
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
import { eq, and, count, sql, desc, isNull } from 'drizzle-orm';
import { cache } from '@/lib/cache';

interface DiagnosticResult {
  category: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  details: any;
  recommendation: string;
}

export class PracticeModuleDiagnostics {
  private results: DiagnosticResult[] = [];

  async runCompleteDiagnostics(): Promise<DiagnosticResult[]> {
    console.log('🔍 Starting Practice Module Diagnostics...');
    
    await this.checkGhostSessions();
    await this.checkTestLimitAccuracy();
    await this.checkSubscriptionConsistency();
    await this.checkOrphanedData();
    await this.checkCacheConsistency();
    await this.checkAnswerSubmissionIssues();
    await this.checkSessionCreationPatterns();
    await this.checkDatabaseConstraints();
    
    return this.results;
  }

  // 1. Check for Ghost Sessions (0 questions, 0 duration)
  async checkGhostSessions() {
    console.log('👻 Checking for ghost sessions...');
    
    const ghostSessions = await db
      .select({
        user_id: practice_sessions.user_id,
        session_count: count()
      })
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.total_questions, 0),
          eq(practice_sessions.questions_attempted, 0),
          isNull(practice_sessions.duration_minutes)
        )
      )
      .groupBy(practice_sessions.user_id)
      .having(sql`count(*) > 1`);

    for (const user of ghostSessions) {
      this.results.push({
        category: 'Session Creation',
        issue: `User has ${user.session_count} ghost sessions`,
        severity: 'high',
        count: user.session_count,
        details: { user_id: user.user_id },
        recommendation: 'Clean up ghost sessions and implement idempotency'
      });
    }

    // Check for recent ghost sessions (last 24 hours)
    const recentGhosts = await db
      .select({ count: count() })
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.total_questions, 0),
          sql`${practice_sessions.start_time} > NOW() - INTERVAL '24 hours'`
        )
      );

    const recentGhostCount = Number(recentGhosts[0]?.count || 0);
    if (recentGhostCount > 0) {
      this.results.push({
        category: 'Session Creation',
        issue: 'Recent ghost sessions detected',
        severity: 'critical',
        count: recentGhostCount,
        details: { timeframe: '24 hours' },
        recommendation: 'Immediate investigation required - active session creation bug'
      });
    }
  }

  // 2. Check Test Limit Accuracy
  async checkTestLimitAccuracy() {
    console.log('📊 Checking test limit accuracy...');
    
    // Check users with inconsistent test counts
    const inconsistentCounts = await db.execute(sql`
      SELECT 
        us.user_id,
        us.tests_used_today,
        us.tests_used_total,
        COUNT(ps.session_id) as actual_sessions_today,
        COUNT(CASE WHEN ps.is_completed = true THEN 1 END) as completed_sessions_today
      FROM user_subscriptions us
      LEFT JOIN practice_sessions ps ON us.user_id = ps.user_id 
        AND DATE(ps.start_time) = CURRENT_DATE
      GROUP BY us.user_id, us.tests_used_today, us.tests_used_total
      HAVING us.tests_used_today != COUNT(CASE WHEN ps.is_completed = true THEN 1 END)
    `);

    for (const row of inconsistentCounts.rows) {
      this.results.push({
        category: 'Test Limits',
        issue: 'Test count mismatch between subscription and actual sessions',
        severity: 'high',
        count: 1,
        details: {
          user_id: row.user_id,
          recorded_tests: Number(row.tests_used_today || 0),
          actual_completed: Number(row.completed_sessions_today || 0),
          total_sessions: Number(row.actual_sessions_today || 0)
        },
        recommendation: 'Recalculate and sync test counts'
      });
    }

    // Check new users with immediate limits
    const newUsersWithLimits = await db.execute(sql`
      SELECT 
        us.user_id,
        us.tests_used_today,
        sp.test_limit_daily,
        us.created_at
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.plan_id
      WHERE us.tests_used_today >= sp.test_limit_daily
        AND us.created_at > NOW() - INTERVAL '1 hour'
        AND (
          SELECT COUNT(*) 
          FROM practice_sessions ps 
          WHERE ps.user_id = us.user_id 
            AND ps.is_completed = true
        ) = 0
    `);

    for (const row of newUsersWithLimits.rows) {
      this.results.push({
        category: 'Test Limits',
        issue: 'New user immediately at test limit without taking tests',
        severity: 'critical',
        count: 1,
        details: {
          user_id: row.user_id,
          tests_used: Number(row.tests_used_today || 0),
          limit: Number(row.test_limit_daily || 0),
          created_at: row.created_at
        },
        recommendation: 'Reset test count for new users'
      });
    }
  }

  // 3. Check Subscription Consistency
  async checkSubscriptionConsistency() {
    console.log('💳 Checking subscription consistency...');
    
    // Users without subscriptions
    const usersWithoutSubs = await db.execute(sql`
      SELECT DISTINCT ps.user_id
      FROM practice_sessions ps
      LEFT JOIN user_subscriptions us ON ps.user_id = us.user_id
      WHERE us.user_id IS NULL
    `);

    for (const row of usersWithoutSubs.rows) {
      this.results.push({
        category: 'Subscriptions',
        issue: 'User has practice sessions but no subscription record',
        severity: 'high',
        count: 1,
        details: { user_id: row.user_id },
        recommendation: 'Create default subscription for user'
      });
    }

    // Check for invalid subscription statuses
    const invalidStatuses = await db.execute(sql`
      SELECT user_id, status, current_period_end
      FROM user_subscriptions
      WHERE status = 'active' 
        AND current_period_end < NOW()
    `);

    for (const row of invalidStatuses.rows) {
      this.results.push({
        category: 'Subscriptions',
        issue: 'Active subscription past expiration date',
        severity: 'medium',
        count: 1,
        details: {
          user_id: row.user_id,
          status: row.status,
          expired_date: row.current_period_end
        },
        recommendation: 'Update subscription status to expired'
      });
    }
  }

  // 4. Check for Orphaned Data
  async checkOrphanedData() {
    console.log('🗑️ Checking for orphaned data...');
    
    // Session questions without sessions
    const orphanedQuestions = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM session_questions sq
      LEFT JOIN practice_sessions ps ON sq.session_id = ps.session_id
      WHERE ps.session_id IS NULL
    `);

    const orphanedQuestionsCount = Number(orphanedQuestions.rows[0]?.count || 0);
    if (orphanedQuestionsCount > 0) {
      this.results.push({
        category: 'Data Integrity',
        issue: 'Session questions exist without parent sessions',
        severity: 'medium',
        count: orphanedQuestionsCount,
        details: {},
        recommendation: 'Clean up orphaned session questions'
      });
    }

    // Question attempts without sessions
    const orphanedAttempts = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM question_attempts qa
      LEFT JOIN practice_sessions ps ON qa.session_id = ps.session_id
      WHERE qa.session_id IS NOT NULL AND ps.session_id IS NULL
    `);

    const orphanedAttemptsCount = Number(orphanedAttempts.rows[0]?.count || 0);
    if (orphanedAttemptsCount > 0) {
      this.results.push({
        category: 'Data Integrity',
        issue: 'Question attempts exist without parent sessions',
        severity: 'medium',
        count: orphanedAttemptsCount,
        details: {},
        recommendation: 'Clean up orphaned question attempts'
      });
    }
  }

  // 5. Check Cache Consistency
  async checkCacheConsistency() {
    console.log('🗄️ Checking cache consistency...');
    
    try {
      // Sample a few users and check cache vs database consistency
      const sampleUsers = await db
        .select({ user_id: user_subscriptions.user_id })
        .from(user_subscriptions)
        .limit(10);

      for (const user of sampleUsers) {
        const cacheKey = `user:${user.user_id}:test-limits`;
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
          // Get fresh data from database
          const dbData = await db
            .select()
            .from(user_subscriptions)
            .where(eq(user_subscriptions.user_id, user.user_id))
            .limit(1);

          if (dbData[0]) {
            const cached = cachedData as any;
            const fresh = dbData[0];
            
            if (cached.limitStatus?.usedToday !== fresh.tests_used_today) {
              this.results.push({
                category: 'Cache Consistency',
                issue: 'Cached test limits don\'t match database',
                severity: 'medium',
                count: 1,
                details: {
                  user_id: user.user_id,
                  cached_count: cached.limitStatus?.usedToday,
                  db_count: fresh.tests_used_today
                },
                recommendation: 'Invalidate and refresh cache'
              });
            }
          }
        }
      }
    } catch (error) {
      this.results.push({
        category: 'Cache Consistency',
        issue: 'Cache system unavailable or corrupted',
        severity: 'high',
        count: 1,
        details: { error: error instanceof Error ? error.message : String(error) },
        recommendation: 'Check Redis/cache service health'
      });
    }
  }

  // 6. Check Answer Submission Issues
  async checkAnswerSubmissionIssues() {
    console.log('✅ Checking answer submission issues...');
    
    // Sessions with mismatched question counts
    const mismatchedSessions = await db.execute(sql`
      SELECT 
        ps.session_id,
        ps.user_id,
        ps.total_questions,
        COUNT(sq.session_question_id) as actual_questions,
        COUNT(qa.attempt_id) as submitted_answers
      FROM practice_sessions ps
      LEFT JOIN session_questions sq ON ps.session_id = sq.session_id
      LEFT JOIN question_attempts qa ON ps.session_id = qa.session_id
      WHERE ps.is_completed = true
      GROUP BY ps.session_id, ps.user_id, ps.total_questions
      HAVING ps.total_questions != COUNT(sq.session_question_id)
         OR COUNT(sq.session_question_id) != COUNT(qa.attempt_id)
    `);

    for (const row of mismatchedSessions.rows) {
      this.results.push({
        category: 'Answer Submission',
        issue: 'Question count mismatch in completed session',
        severity: 'high',
        count: 1,
        details: {
          session_id: Number(row.session_id || 0),
          user_id: row.user_id,
          recorded_total: Number(row.total_questions || 0),
          actual_questions: Number(row.actual_questions || 0),
          submitted_answers: Number(row.submitted_answers || 0)
        },
        recommendation: 'Investigate answer submission flow'
      });
    }

    // Check for incomplete sessions older than 2 hours
    const staleSessions = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM practice_sessions
      WHERE is_completed = false 
        AND start_time < NOW() - INTERVAL '2 hours'
        AND total_questions > 0
    `);

    const staleSessionsCount = Number(staleSessions.rows[0]?.count || 0);
    if (staleSessionsCount > 0) {
      this.results.push({
        category: 'Session Management',
        issue: 'Sessions left incomplete for over 2 hours',
        severity: 'medium',
        count: staleSessionsCount,
        details: {},
        recommendation: 'Auto-complete or clean up stale sessions'
      });
    }
  }

  // 7. Check Session Creation Patterns
  async checkSessionCreationPatterns() {
    console.log('🔄 Checking session creation patterns...');
    
    // Users with rapid session creation (potential race conditions)
    const rapidCreation = await db.execute(sql`
      SELECT 
        user_id,
        COUNT(*) as session_count,
        MIN(start_time) as first_session,
        MAX(start_time) as last_session
      FROM practice_sessions
      WHERE start_time > NOW() - INTERVAL '1 hour'
      GROUP BY user_id
      HAVING COUNT(*) > 5
        AND EXTRACT(EPOCH FROM (MAX(start_time) - MIN(start_time))) < 300
    `);

    for (const row of rapidCreation.rows) {
      this.results.push({
        category: 'Session Creation',
        issue: 'Rapid session creation detected (potential race condition)',
        severity: 'high',
        count: Number(row.session_count || 0),
        details: {
          user_id: row.user_id,
          sessions_in_5min: Number(row.session_count || 0),
          time_span: '5 minutes'
        },
        recommendation: 'Implement stronger idempotency controls'
      });
    }
  }

  // 8. Check Database Constraints and Integrity
  async checkDatabaseConstraints() {
    console.log('🔍 Checking database constraints...');
    
    // Check for missing foreign key relationships
    const invalidQuestions = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM session_questions sq
      LEFT JOIN questions q ON sq.question_id = q.question_id
      WHERE q.question_id IS NULL
    `);

    const invalidQuestionsCount = Number(invalidQuestions.rows[0]?.count || 0);
    if (invalidQuestionsCount > 0) {
      this.results.push({
        category: 'Data Integrity',
        issue: 'Session questions reference non-existent questions',
        severity: 'critical',
        count: invalidQuestionsCount,
        details: {},
        recommendation: 'Clean up invalid question references'
      });
    }

    // Check for null values in required fields
    const nullChecks = [
      { table: 'practice_sessions', field: 'user_id' },
      { table: 'practice_sessions', field: 'session_type' },
      { table: 'user_subscriptions', field: 'plan_id' },
      { table: 'session_questions', field: 'question_order' }
    ];

    for (const check of nullChecks) {
      const nullCount = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM ${sql.identifier(check.table)}
        WHERE ${sql.identifier(check.field)} IS NULL
      `);

      const nullCountValue = Number(nullCount.rows[0]?.count || 0);
      if (nullCountValue > 0) {
        this.results.push({
          category: 'Data Integrity',
          issue: `Null values in required field ${check.table}.${check.field}`,
          severity: 'critical',
          count: nullCountValue,
          details: { table: check.table, field: check.field },
          recommendation: 'Fix null values and add database constraints'
        });
      }
    }
  }

  // Generate Summary Report
  generateReport(): string {
    const groupedResults = this.results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {} as Record<string, DiagnosticResult[]>);

    let report = '\n🔍 PRACTICE MODULE DIAGNOSTIC REPORT\n';
    report += '=====================================\n\n';

    const severityCounts = {
      critical: this.results.filter(r => r.severity === 'critical').length,
      high: this.results.filter(r => r.severity === 'high').length,
      medium: this.results.filter(r => r.severity === 'medium').length,
      low: this.results.filter(r => r.severity === 'low').length
    };

    report += `📊 SUMMARY:\n`;
    report += `   🔴 Critical Issues: ${severityCounts.critical}\n`;
    report += `   🟠 High Priority: ${severityCounts.high}\n`;
    report += `   🟡 Medium Priority: ${severityCounts.medium}\n`;
    report += `   🟢 Low Priority: ${severityCounts.low}\n\n`;

    for (const [category, issues] of Object.entries(groupedResults)) {
      report += `📋 ${category.toUpperCase()}\n`;
      report += '-'.repeat(category.length + 4) + '\n';
      
      for (const issue of issues) {
        const severity = {
          critical: '🔴',
          high: '🟠', 
          medium: '🟡',
          low: '🟢'
        }[issue.severity];
        
        report += `${severity} ${issue.issue}\n`;
        report += `   Count: ${issue.count}\n`;
        report += `   Recommendation: ${issue.recommendation}\n`;
        if (Object.keys(issue.details).length > 0) {
          report += `   Details: ${JSON.stringify(issue.details, null, 2)}\n`;
        }
        report += '\n';
      }
    }

    return report;
  }
}

// Export for use in scripts or API endpoints
export async function runDiagnostics() {
  const diagnostics = new PracticeModuleDiagnostics();
  const results = await diagnostics.runCompleteDiagnostics();
  const report = diagnostics.generateReport();
  
  console.log(report);
  return { results, report };
}

// CLI usage
if (require.main === module) {
  runDiagnostics().catch(console.error);
}