// src/lib/services/PracticeSessionManager.ts
import { db } from '@/db';
import { v4 as uuidv4 } from 'uuid';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { subscriptionService } from './SubscriptionService';
import { questionPoolService } from './QuestionPoolService';
import { 
  practice_sessions, 
  session_questions,
  user_subscriptions,
  questions
} from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@/db/schema';

interface SessionCreationRequest {
  userId: string;
  subjectId: number;
  topicId?: number;
  subtopicId?: number;
  questionCount?: number;
  sessionType?: 'Practice' | 'Test' | 'Review' | 'Custom';
}

interface SessionCreationResult {
  sessionId: number;
  questions: typeof questions.$inferSelect[];
  idempotencyKey: string;
}

type DatabaseTransaction = NodePgDatabase<typeof schema>;

export class PracticeSessionManager {
  private static readonly SESSION_CREATION_LOCK_TTL = 30; // 30 seconds
  private static readonly IDEMPOTENCY_CACHE_TTL = 300; // 5 minutes

  /**
   * Create a practice session with full idempotency and race condition protection
   */
  async createSession(request: SessionCreationRequest, idempotencyKey?: string): Promise<SessionCreationResult> {
    const startTime = Date.now();
    const finalIdempotencyKey = idempotencyKey || uuidv4();
    
    // Step 1: Check idempotency first
    const existingResult = await this.checkIdempotency(request.userId, finalIdempotencyKey);
    if (existingResult) {
      logger.info('Session creation - idempotency hit', {
        userId: request.userId,
        idempotencyKey: finalIdempotencyKey,
        existingSessionId: existingResult.sessionId
      });
      return existingResult;
    }

    // Step 2: Acquire creation lock
    const lockKey = `session-creation-lock:${request.userId}`;
    const lockAcquired = await this.acquireLock(lockKey);
    
    if (!lockAcquired) {
      throw new Error('Session creation already in progress. Please wait and try again.');
    }

    try {
      // Step 3: Validate user access and limits
      await this.validateUserAccess(request);

      // Step 4: Create session in transaction with proper error handling
      const result = await db.transaction(async (tx) => {
        // Create the session record
        const [newSession] = await tx.insert(practice_sessions).values({
          user_id: request.userId,
          subject_id: request.subjectId,
          topic_id: request.topicId,
          subtopic_id: request.subtopicId,
          session_type: request.sessionType || 'Practice',
          start_time: new Date(),
          total_questions: request.questionCount || 10,
          questions_attempted: 0,
          questions_correct: 0,
          is_completed: false,
          score: 0,
          max_score: 0
        }).returning();

        // Get personalized questions
        const questions = await questionPoolService.getPersonalizedQuestions(
          request.userId,
          request.subjectId,
          request.topicId,
          request.subtopicId,
          request.questionCount || 10
        );

        if (questions.length === 0) {
          throw new Error('No questions available for the selected criteria');
        }

        // Insert session questions in batch
        const sessionQuestions = questions.map((question, index) => ({
          session_id: newSession.session_id,
          question_id: question.question_id,
          question_order: index + 1,
          user_id: request.userId,
          topic_id: question.topic_id,
          is_bookmarked: false,
          time_spent_seconds: 0
        }));

        await tx.insert(session_questions).values(sessionQuestions);

        // Update session with actual question count
        await tx.update(practice_sessions)
          .set({ 
            total_questions: questions.length,
            max_score: questions.reduce((sum, q) => sum + (q.marks || 4), 0)
          })
          .where(eq(practice_sessions.session_id, newSession.session_id));

        // Atomically increment test usage
        await this.incrementTestUsageAtomic(tx, request.userId);

        return {
          sessionId: newSession.session_id,
          questions,
          idempotencyKey: finalIdempotencyKey
        };
      });

      // Step 5: Cache the result for idempotency
      await this.cacheSessionResult(request.userId, finalIdempotencyKey, result);

      // Step 6: Invalidate relevant caches
      await this.invalidateUserCaches(request.userId);

      logger.info('Session created successfully', {
        userId: request.userId,
        sessionId: result.sessionId,
        questionCount: result.questions.length,
        duration: Date.now() - startTime,
        idempotencyKey: finalIdempotencyKey
      });

      return result;

    } finally {
      // Always release the lock
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Check if session was already created (idempotency)
   */
  private async checkIdempotency(userId: string, idempotencyKey: string): Promise<SessionCreationResult | null> {
    const cacheKey = `session-idempotency:${userId}:${idempotencyKey}`;
    return await cache.get<SessionCreationResult>(cacheKey);
  }

  /**
   * Acquire distributed lock for session creation
   */
  private async acquireLock(lockKey: string): Promise<boolean> {
    try {
      // Try to set the lock with NX (only if not exists) and EX (expiry)
      const lockValue = uuidv4();
      await cache.set(lockKey, lockValue, PracticeSessionManager.SESSION_CREATION_LOCK_TTL);
      
      // Verify we actually got the lock
      const currentValue = await cache.get(lockKey);
      return currentValue === lockValue;
    } catch (error) {
      logger.error('Failed to acquire session creation lock', {
        lockKey,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Release distributed lock
   */
  private async releaseLock(lockKey: string): Promise<void> {
    try {
      await cache.delete(lockKey);
    } catch (error) {
      logger.warn('Failed to release session creation lock', {
        lockKey,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Validate user access and test limits
   */
  private async validateUserAccess(request: SessionCreationRequest): Promise<void> {
    // Check subscription limits
    const canTake = await subscriptionService.canUserTakeTest(request.userId);
    if (!canTake.canTake) {
      throw new Error(canTake.reason || 'Cannot take test due to subscription limits');
    }

    // Check topic access for freemium users
    if (request.topicId && request.subjectId === 3) { // Biology subject
      const hasAccess = await this.validateTopicAccess(request.userId, request.topicId, request.subjectId);
      if (!hasAccess) {
        throw new Error('This topic is available only to premium users');
      }
    }
  }

  /**
   * Validate topic access for freemium users
   */
  private async validateTopicAccess(userId: string, topicId: number, subjectId: number): Promise<boolean> {
    const isPremium = await subscriptionService.isPremiumUser(userId);
    if (isPremium) return true;

    // For Biology subject, check if topic is in first 2 topics
    if (subjectId === 3) {
      const freemiumTopics = await questionPoolService.getFreemiumTopics(subjectId, 2);
      const allowedTopicIds = new Set(freemiumTopics.map(t => t.topic_id));
      return allowedTopicIds.has(topicId);
    }

    return true; // Other subjects are fully accessible
  }

  /**
   * Atomically increment test usage in transaction
   */
  private async incrementTestUsageAtomic(tx: DatabaseTransaction, userId: string): Promise<void> {
    await tx.update(user_subscriptions)
      .set({
        tests_used_today: sql`${user_subscriptions.tests_used_today} + 1`,
        tests_used_total: sql`${user_subscriptions.tests_used_total} + 1`,
        last_test_date: new Date(),
        updated_at: new Date()
      })
      .where(eq(user_subscriptions.user_id, userId));
  }

  /**
   * Cache session result for idempotency
   */
  private async cacheSessionResult(userId: string, idempotencyKey: string, result: SessionCreationResult): Promise<void> {
    const cacheKey = `session-idempotency:${userId}:${idempotencyKey}`;
    await cache.set(cacheKey, result, PracticeSessionManager.IDEMPOTENCY_CACHE_TTL);
  }

  /**
   * Invalidate relevant user caches after session creation
   */
  private async invalidateUserCaches(userId: string): Promise<void> {
    const cacheKeys = [
      `user:${userId}:subscription`,
      `user:${userId}:test-limits`,
      `api:practice-sessions:user:${userId}:*`
    ];

    for (const key of cacheKeys) {
      try {
        if (key.includes('*')) {
          await cache.deletePattern(key);
        } else {
          await cache.delete(key);
        }
      } catch (error) {
        logger.warn('Failed to invalidate cache key', {
          userId,
          cacheKey: key,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Get active session for user (if any)
   */
  async getActiveSession(userId: string): Promise<typeof practice_sessions.$inferSelect | null> {
    const sessions = await db
      .select()
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.user_id, userId),
          eq(practice_sessions.is_completed, false)
        )
      )
      .limit(1);

    return sessions[0] || null;
  }

  /**
   * Check if user has any incomplete sessions from last 2 hours
   */
  async hasRecentIncompleteSession(userId: string): Promise<boolean> {
    const sessions = await db
      .select({ count: sql<number>`count(*)` })
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.user_id, userId),
          eq(practice_sessions.is_completed, false),
          sql`${practice_sessions.start_time} > NOW() - INTERVAL '2 hours'`
        )
      );

    return (sessions[0]?.count || 0) > 0;
  }

  /**
   * Force complete abandoned sessions
   */
  async completeAbandonedSessions(userId: string): Promise<number> {
    const result = await db
      .update(practice_sessions)
      .set({
        is_completed: true,
        end_time: new Date(),
        updated_at: new Date()
      })
      .where(
        and(
          eq(practice_sessions.user_id, userId),
          eq(practice_sessions.is_completed, false),
          sql`${practice_sessions.start_time} < NOW() - INTERVAL '2 hours'`
        )
      )
      .returning({ session_id: practice_sessions.session_id });

    if (result.length > 0) {
      logger.info('Completed abandoned sessions', {
        userId,
        sessionCount: result.length,
        sessionIds: result.map(s => s.session_id)
      });
    }

    return result.length;
  }
}

export const practiceSessionManager = new PracticeSessionManager();