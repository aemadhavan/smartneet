// src/app/api/practice-sessions/[sessionId]/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  practice_sessions, 
  session_questions,
  question_attempts,
  questions,
  topics,
} from '@/db';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/services/CacheService';
import { CACHE_TTLS, RATE_LIMITS, applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { 
  TopicPerformance,
  CalculatedMetrics,
  SessionSummaryResponse
} from '@/types/session-summary';

/**
 * Get a summary of a practice session's performance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Access the sessionId from params
    const sessionId = parseInt((await params).sessionId);

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      userId, 
      `get-session-summary:${sessionId}`, 
      RATE_LIMITS.GET_SESSION_SUMMARY
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const cacheKey = `session:${userId}:${sessionId}:summary`;

    logger.debug('Fetching session summary', {
      userId,
      context: 'practice-sessions/[sessionId]/summary.GET',
      data: { sessionId, cacheKey }
    });

    // Try to get from cache first
    const cachedSummary = await cache.get<SessionSummaryResponse>(cacheKey);
    if (cachedSummary) {
      logger.debug('Cache hit for session summary', {
        userId,
        context: 'practice-sessions/[sessionId]/summary.GET',
        data: { sessionId }
      });
      return NextResponse.json({ 
        ...cachedSummary, 
        source: 'cache' 
      });
    }
    
    // Ensure session stats are up-to-date before fetching summary
    const { updateSessionStats } = await import('@/lib/utilities/sessionUtils');
    await updateSessionStats(sessionId, userId);

    // Get the session details
    const [sessionData] = await db
      .select()
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.session_id, sessionId),
          eq(practice_sessions.user_id, userId)
        )
      );

    if (!sessionData) {
      logger.warn('Session not found for summary', {
        userId,
        context: 'practice-sessions/[sessionId]/summary.GET',
        data: { sessionId }
      });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get all questions in this session with their attempts
    const sessionQuestionData = await db.select({
      questionId: session_questions.question_id,
      topicId: questions.topic_id,
      topicName: topics.topic_name,
      isCorrect: question_attempts.is_correct,
      marksAwarded: question_attempts.marks_awarded,
      marksPossible: questions.marks,
      timeTaken: session_questions.time_spent_seconds
    })
    .from(session_questions)
    .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
    .innerJoin(topics, eq(questions.topic_id, topics.topic_id))
    .leftJoin(
      question_attempts, 
      and(
        eq(question_attempts.session_id, sessionId),
        eq(question_attempts.question_id, session_questions.question_id),
        eq(question_attempts.user_id, userId)
      )
    )
    .where(
      and(
        eq(session_questions.session_id, sessionId),
        eq(session_questions.user_id, userId)
      )
    );

    const totalQuestions = sessionQuestionData.length;
    
    // Process topic performance data
    const topicMap = new Map<number, {
      topicName: string;
      questionsTotal: number;
      questionsCorrect: number;
    }>();

    // Calculate metrics from question data
    const calculatedMetrics: CalculatedMetrics = sessionQuestionData.reduce((metrics, question) => {
      // Track topic-level statistics
      if (!topicMap.has(question.topicId)) {
        topicMap.set(question.topicId, {
          topicName: question.topicName,
          questionsTotal: 0,
          questionsCorrect: 0
        });
      }
      
      const topicStats = topicMap.get(question.topicId)!;
      topicStats.questionsTotal++;
      
      // Count correct answers
      if (question.isCorrect) {
        metrics.questionsCorrect++;
        topicStats.questionsCorrect++;
      }
      
      // Sum scores and time
      metrics.score += question.marksAwarded || 0;
      metrics.maxScore += question.marksPossible || 0;
      metrics.totalTimeSeconds += question.timeTaken || 0;
      
      return metrics;
    }, {
      questionsCorrect: 0,
      score: 0,
      maxScore: 0,
      totalTimeSeconds: 0
    });

    // Convert seconds to minutes
    const calculatedTimeTakenMinutes = Math.round(calculatedMetrics.totalTimeSeconds / 60);

    // Create topic performance array from the map
    const topicPerformance: TopicPerformance[] = Array.from(topicMap.entries())
      .map(([topicId, stats]) => ({
        topicId,
        topicName: stats.topicName,
        questionsCorrect: stats.questionsCorrect,
        questionsTotal: stats.questionsTotal,
        accuracy: stats.questionsTotal > 0 
          ? Math.round((stats.questionsCorrect / stats.questionsTotal) * 100)
          : 0
      }))
      // Sort by most questions first
      .sort((a, b) => b.questionsTotal - a.questionsTotal); 

    const summaryData: SessionSummaryResponse = {
      sessionId,
      totalQuestions: sessionData.total_questions ?? 0,
      questionsAttempted: sessionData.questions_attempted ?? 0,
      questionsCorrect: sessionData.questions_correct ?? 0,
      questionsIncorrect: (sessionData.questions_attempted ?? 0) - (sessionData.questions_correct ?? 0),
      accuracy: (sessionData.questions_attempted ?? 0) > 0 
        ? Math.round(((sessionData.questions_correct ?? 0) / (sessionData.questions_attempted ?? 1)) * 100)
        : 0,
      calculatedAccuracy: totalQuestions > 0 
        ? Math.round((calculatedMetrics.questionsCorrect / totalQuestions) * 100)
        : 0,
      timeTakenMinutes: sessionData.duration_minutes ?? calculatedTimeTakenMinutes, 
      score: sessionData.score ?? calculatedMetrics.score, 
      maxScore: sessionData.max_score || calculatedMetrics.maxScore,
      topicPerformance,
      source: 'database'
    };

    // Ensure session is marked as completed if not already (idempotent)
    if (!sessionData.is_completed) {
      logger.info('Marking session as completed during summary', {
        userId,
        context: 'practice-sessions/[sessionId]/summary.GET',
        data: { sessionId }
      });
      
      await db.update(practice_sessions)
        .set({
          end_time: sessionData.end_time || new Date(), // Use existing end_time if already set
          is_completed: true,
          updated_at: new Date()
        })
        .where(
          and(
            eq(practice_sessions.session_id, sessionId),
            eq(practice_sessions.user_id, userId)
          )
        );
    }
    
    // Cache the result
    await cache.set(cacheKey, summaryData, CACHE_TTLS.SESSION_SUMMARY_CACHE);
    await cacheService.trackCacheKey(userId, cacheKey);

    logger.info('Generated session summary', {
      userId,
      context: 'practice-sessions/[sessionId]/summary.GET',
      data: { 
        sessionId, 
        questionsTotal: totalQuestions,
        accuracy: summaryData.accuracy,
        topicCount: topicPerformance.length
      }
    });

    return NextResponse.json(summaryData);
    
  } catch (error) {
    logger.error('Error retrieving session summary', {
      context: 'practice-sessions/[sessionId]/summary.GET',
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating the session summary.' }, 
      { status: 500 }
    );
  }
}