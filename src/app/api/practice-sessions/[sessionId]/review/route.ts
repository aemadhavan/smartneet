// src/app/api/practice-sessions/[sessionId]/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  question_attempts,
  topics,
  subtopics,
  practice_sessions,
  session_questions,
  questions
} from '@/db';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { getCorrectAnswer } from '@/app/practice-sessions/[sessionId]/review/components/helpers';
import { 
  NormalizedQuestionDetails, 
  QuestionType, 
  NormalizedAnswer 
} from '@/app/practice-sessions/[sessionId]/review/components/interfaces';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/services/CacheService';
import { CACHE_TTLS, RATE_LIMITS, applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { 
  SessionReviewResponse,
  SessionReviewInfo,
  DetailedReviewQuestion,
  SessionReviewSummary,
  EmptySessionResponse
} from '@/types/session-review';

// Constants for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Retry wrapper for database operations that might hit connection limits
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      
      // Check if it's a concurrency limit error
      if (
        typeof error === 'object' && 
        error !== null && 
        ('code' in error && error.code === 'XATA_CONCURRENCY_LIMIT' || 
         ('message' in error && typeof error.message === 'string' && 
          error.message.includes('concurrent connections limit exceeded')))
      ) {
        attempt++;
        logger.warn(`Database connection limit exceeded, retrying operation`, {
          context: 'practice-sessions/[sessionId]/review.withRetry',
          data: {
            attempt,
            maxRetries: MAX_RETRIES,
            delay: RETRY_DELAY * attempt
          },
          error: error instanceof Error ? error.message : String(error)
        });
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
  
  throw lastError!;
}

/**
 * Get detailed review information for a specific practice session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    
    // Await the params and then parse the sessionId
    const { sessionId: sessionIdParam } = await params;
    const sessionId = parseInt(sessionIdParam);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      userId, 
      `get-session-review:${sessionId}`, 
      RATE_LIMITS.GET_SESSION_REVIEW
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const cacheKey = `session:${userId}:${sessionId}:review`;

    logger.debug('Fetching session review details', {
      userId,
      context: 'practice-sessions/[sessionId]/review.GET',
      data: { sessionId, cacheKey }
    });

    // Try to get from cache first
    const cachedData = await cache.get<SessionReviewResponse | EmptySessionResponse>(cacheKey);
    if (cachedData) {
      logger.debug('Cache hit for session review', {
        userId,
        context: 'practice-sessions/[sessionId]/review.GET',
        data: { sessionId }
      });
      return NextResponse.json({ 
        ...cachedData, 
        source: 'cache' 
      });
    }

    // First verify that the session belongs to this user and fetch its details
    const sessionDetails = await withRetry(async () => {
      return db.query.practice_sessions.findFirst({
        where: and(
          eq(practice_sessions.session_id, sessionId),
          eq(practice_sessions.user_id, userId)
        ),
        with: {
          subject: { columns: { subject_name: true } },
          topic: { columns: { topic_name: true } },
          subtopic: { columns: { subtopic_name: true } }
        }
      });
    });

    if (!sessionDetails) {
      logger.warn('Session not found or unauthorized', {
        userId,
        context: 'practice-sessions/[sessionId]/review.GET',
        data: { sessionId }
      });
      return NextResponse.json(
        { error: 'Session not found or does not belong to the current user' },
        { status: 404 }
      );
    }

    // Get all question attempts for this session, ordered by attempt_timestamp descending
    // to easily pick the latest attempt if multiple exist for a single question
    const attempts = await withRetry(async () => {
      return db.query.question_attempts.findMany({
        where: and(
          eq(question_attempts.session_id, sessionId),
          eq(question_attempts.user_id, userId)
        ),
        orderBy: desc(question_attempts.attempt_timestamp),
        with: {
          question: {
            columns: {
              question_id: true,
              question_text: true,
              question_type: true,
              details: true,
              explanation: true,
              marks: true,
              negative_marks: true,
              difficulty_level: true,
              topic_id: true,
              subtopic_id: true,
              is_image_based: true,
              image_url: true
            }
          }
        }
      });
    });
    
    // If no attempts, still return basic session info and empty attempts/summary
    if (!attempts.length) {
      const questionsAttempted = sessionDetails.questions_attempted ?? 0;
      const questionsCorrect = sessionDetails.questions_correct ?? 0;
      const accuracy = questionsAttempted > 0 
        ? Math.round((questionsCorrect / questionsAttempted) * 100) 
        : 0;

      const emptyResponse: EmptySessionResponse = {
        session: {
          session_id: sessionDetails.session_id,
          session_type: sessionDetails.session_type,
          start_time: sessionDetails.start_time,
          end_time: sessionDetails.end_time ?? undefined,
          duration_minutes: sessionDetails.duration_minutes ?? undefined,
          subject_name: sessionDetails.subject?.subject_name || '',
          topic_name: sessionDetails.topic?.topic_name ?? undefined,
          subtopic_name: sessionDetails.subtopic?.subtopic_name ?? undefined,
          total_questions: sessionDetails.total_questions ?? 0,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          score: sessionDetails.score ?? undefined,
          max_score: sessionDetails.max_score ?? undefined,
          accuracy: accuracy,
        },
        attempts: [],
        summary: {
          total_questions: sessionDetails.total_questions ?? 0,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          accuracy: accuracy,
          score: sessionDetails.score ?? undefined,
          max_score: sessionDetails.max_score ?? undefined,
        },
        source: 'empty_session_no_attempts'
      };
      
      // Cache empty response
      await cache.set(cacheKey, emptyResponse, CACHE_TTLS.SESSION_REVIEW_CACHE);
      await cacheService.trackCacheKey(userId, cacheKey);
      
      logger.info('Returning empty session review data', {
        userId,
        context: 'practice-sessions/[sessionId]/review.GET',
        data: { sessionId }
      });
      
      return NextResponse.json(emptyResponse);
    }

    // Get session questions to map is_bookmarked, question_order, time_spent_seconds
    const sessionQsData = await db.query.session_questions.findMany({
      where: and(
        eq(session_questions.session_id, sessionId),
        eq(session_questions.user_id, userId) // Ensure user_id matches for security
      ),
      columns: {
        question_id: true,
        question_order: true,
        time_spent_seconds: true,
        is_bookmarked: true 
      }
    });

    // Create a map for easy lookup of session question details
    const sessionQuestionDetailsMap: Record<number, { 
      order: number, 
      timeSpent: number, 
      isBookmarked: boolean 
    }> = {};
    
    sessionQsData.forEach(sq => {
      sessionQuestionDetailsMap[sq.question_id] = { 
        order: sq.question_order, 
        timeSpent: sq.time_spent_seconds ?? 0,
        isBookmarked: sq.is_bookmarked ?? false
      };
    });
    
    // Collect topic and subtopic IDs for efficient batch loading
    const topicIdsFromAttempts = new Set<number>();
    const subtopicIdsFromAttempts = new Set<number>();

    attempts.forEach(attempt => {
      if (attempt.question.topic_id) {
        topicIdsFromAttempts.add(attempt.question.topic_id);
      }
      if (attempt.question.subtopic_id) {
        subtopicIdsFromAttempts.add(attempt.question.subtopic_id);
      }
    });

    // Batch load topics
    let topicMap = new Map<number, { topic_id: number; topic_name: string }>();
    if (topicIdsFromAttempts.size > 0) {
      const topicsData = await withRetry(async () => {
        return db.query.topics.findMany({
          where: inArray(topics.topic_id, Array.from(topicIdsFromAttempts)),
          columns: { topic_id: true, topic_name: true }
        });
      });
      topicMap = new Map(topicsData.map(t => [t.topic_id, t]));
    }

    // Batch load subtopics
    let subtopicMap = new Map<number, { subtopic_id: number; subtopic_name: string }>();
    if (subtopicIdsFromAttempts.size > 0) {
      const subtopicsData = await withRetry(async () => {
        return db.query.subtopics.findMany({
          where: inArray(subtopics.subtopic_id, Array.from(subtopicIdsFromAttempts)),
          columns: { subtopic_id: true, subtopic_name: true }
        });
      });
      subtopicMap = new Map(subtopicsData.map(st => [st.subtopic_id, st]));
    }

    // Fetch all questions in the session (regardless of attempts)
    const questionIds = sessionQsData.map(sq => sq.question_id);
    const allQuestionsInSession = await withRetry(async () => {
      return db.query.questions.findMany({
        where: inArray(questions.question_id, questionIds),
        columns: {
          question_id: true,
          question_text: true,
          question_type: true,
          details: true,
          explanation: true,
          marks: true,
          negative_marks: true,
          difficulty_level: true,
          topic_id: true,
          subtopic_id: true,
          is_image_based: true,
          image_url: true
        }
      });
    });

    // Create a map for quick question lookup
    const questionMap = new Map(allQuestionsInSession.map(q => [q.question_id, q]));

    // Update topic and subtopic collection to include data from all questions
    allQuestionsInSession.forEach(question => {
      if (question.topic_id) {
        topicIdsFromAttempts.add(question.topic_id);
      }
      if (question.subtopic_id) {
        subtopicIdsFromAttempts.add(question.subtopic_id);
      }
    });

    // Re-fetch topics and subtopics with updated IDs
    topicMap = new Map<number, { topic_id: number; topic_name: string }>();
    if (topicIdsFromAttempts.size > 0) {
      const topicsData = await withRetry(async () => {
        return db.query.topics.findMany({
          where: inArray(topics.topic_id, Array.from(topicIdsFromAttempts)),
          columns: { topic_id: true, topic_name: true }
        });
      });
      topicMap = new Map(topicsData.map(t => [t.topic_id, t]));
    }

    subtopicMap = new Map<number, { subtopic_id: number; subtopic_name: string }>();
    if (subtopicIdsFromAttempts.size > 0) {
      const subtopicsData = await withRetry(async () => {
        return db.query.subtopics.findMany({
          where: inArray(subtopics.subtopic_id, Array.from(subtopicIdsFromAttempts)),
          columns: { subtopic_id: true, subtopic_name: true }
        });
      });
      subtopicMap = new Map(subtopicsData.map(st => [st.subtopic_id, st]));
    }

    // Combine all data to create detailed review questions
    const detailedReviewQuestions: DetailedReviewQuestion[] = sessionQsData.map(sq => {
      const attempt = attempts.find(a => a.question_id === sq.question_id);
      const question = questionMap.get(sq.question_id); 

      // Use question data from the questions table, fall back to attempt data if needed
      const topicId = question?.topic_id || attempt?.question.topic_id;
      const subtopicId = question?.subtopic_id || attempt?.question.subtopic_id;
      
      const topicInfoFromMap = topicId ? topicMap.get(topicId) : null;
      
      let subtopicInfoFromMap = null;
      if (subtopicId) {
        const subtopicData = subtopicMap.get(subtopicId);
        if (subtopicData) {
          subtopicInfoFromMap = {
            subtopicId: subtopicData.subtopic_id,
            subtopicName: subtopicData.subtopic_name
          };
        }
      }
      
      const questionDetails = (question?.details || attempt?.question.details) as NormalizedQuestionDetails | null;
      const questionType = (question?.question_type || attempt?.question.question_type) as QuestionType | undefined;

      return {
        question_id: sq.question_id,
        question_order: sessionQuestionDetailsMap[sq.question_id]?.order ?? 0, 
        time_spent_seconds: sessionQuestionDetailsMap[sq.question_id]?.timeSpent ?? 0, 
        is_bookmarked: sessionQuestionDetailsMap[sq.question_id]?.isBookmarked ?? false, 
        question_text: question?.question_text || attempt?.question.question_text || "Question data missing",
        question_type: questionType || "Unknown",
        details: questionDetails ?? undefined,
        explanation: question?.explanation || attempt?.question.explanation || undefined,
        user_answer: (attempt?.user_answer as NormalizedAnswer | null) ?? undefined,
        is_correct: attempt?.is_correct ?? null,
        correct_answer: questionDetails && questionType ? getCorrectAnswer(questionDetails, questionType) : undefined,
        marks_awarded: attempt?.marks_awarded ?? 0,
        marks_available: question?.marks || attempt?.question.marks || 0,
        negative_marks: question?.negative_marks || attempt?.question.negative_marks || 0,
        difficulty_level: question?.difficulty_level || attempt?.question.difficulty_level || undefined,
        topic: {
          topic_id: topicInfoFromMap?.topic_id,
          topic_name: topicInfoFromMap?.topic_name || "Unknown Topic"
        },
        subtopic: subtopicInfoFromMap ?? undefined,
        is_image_based: question?.is_image_based || attempt?.question.is_image_based || false,
        image_url: question?.image_url || attempt?.question.image_url || undefined
      };
    });

    // Sort by question order
    detailedReviewQuestions.sort((a, b) => a.question_order - b.question_order);
    
    // Create the session summary
    const questionsAttempted = sessionDetails.questions_attempted ?? 0;
    const questionsCorrect = sessionDetails.questions_correct ?? 0;
    const accuracy = questionsAttempted > 0 
      ? Math.round((questionsCorrect / questionsAttempted) * 100) 
      : 0;

    const finalSummary: SessionReviewSummary = {
      total_questions: sessionDetails.total_questions ?? 0,
      questions_attempted: questionsAttempted,
      questions_correct: questionsCorrect,
      accuracy: accuracy,
      score: sessionDetails.score ?? undefined,
      max_score: sessionDetails.max_score ?? undefined,
    };

    const sessionInfo: SessionReviewInfo = {
      session_id: sessionDetails.session_id,
      session_type: sessionDetails.session_type,
      start_time: sessionDetails.start_time,
      end_time: sessionDetails.end_time ?? undefined,
      duration_minutes: sessionDetails.duration_minutes ?? undefined,
      subject_name: sessionDetails.subject?.subject_name || '',
      topic_name: sessionDetails.topic?.topic_name ?? undefined,
      subtopic_name: sessionDetails.subtopic?.subtopic_name ?? undefined,
      total_questions: finalSummary.total_questions,
      questions_attempted: finalSummary.questions_attempted,
      questions_correct: finalSummary.questions_correct,
      accuracy: finalSummary.accuracy,
      score: finalSummary.score,
      max_score: finalSummary.max_score
    };

    // Ensure deep copies of complex objects to prevent JSON parsing issues
    const responseData: SessionReviewResponse = {
      session: sessionInfo,
      questions: detailedReviewQuestions.map(q => ({
        ...q,
        details: q.details ? JSON.parse(JSON.stringify(q.details)) : undefined,
        user_answer: q.user_answer ? JSON.parse(JSON.stringify(q.user_answer)) : undefined,
        correct_answer: q.correct_answer ? JSON.parse(JSON.stringify(q.correct_answer)) : undefined,
        is_image_based: q.is_image_based ?? false
      })),
      source: 'database'
    };
    
    // Cache the response
    await cache.set(cacheKey, responseData, CACHE_TTLS.SESSION_REVIEW_CACHE);
    await cacheService.trackCacheKey(userId, cacheKey);

    logger.info('Retrieved session review data', {
      userId,
      context: 'practice-sessions/[sessionId]/review.GET',
      data: { 
        sessionId, 
        questionCount: detailedReviewQuestions.length 
      }
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error retrieving session review data', {
      context: 'practice-sessions/[sessionId]/review.GET',
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Add specific handling for concurrency errors
    if (
      error instanceof Error && 
      (error.message.includes('concurrent connections limit') || 
       (typeof error === 'object' && 
        error !== null && 
        'code' in error && 
        error.code === 'XATA_CONCURRENCY_LIMIT'))
    ) {
      return NextResponse.json(
        { error: 'Database is busy, please try again shortly' },
        { status: 503 }  // Service Unavailable
      );
    }
    
    // Handle database errors
    if (error instanceof Error) {
      logger.error('Database error in session review', {
        context: 'practice-sessions/[sessionId]/review.GET',
        error: error.message
      });
      return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
    }
    
    // Return a generic error message to the client
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}