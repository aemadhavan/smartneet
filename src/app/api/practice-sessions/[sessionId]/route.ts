// src/app/api/practice-sessions/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  practice_sessions, 
  session_questions,
  questions,
  topics,
  subtopics
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/services/CacheService';
import { z } from 'zod';
import { CACHE_TTLS, RATE_LIMITS, applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { 
  SessionDetailResponse,
  SessionDetail,
  SessionQuestionDetail, 
  UpdateSessionDetailRequest 
} from '@/types/session-detail';

// Define validation schema for session updates
const sessionUpdateSchema = z.object({
  questions_attempted: z.number().optional(),
  questions_correct: z.number().optional(),
  score: z.number().optional(),
  max_score: z.number().optional(),
  is_completed: z.boolean().optional(),
  end_time: z.date().optional(),
  notes: z.string().optional(),
  settings: z.record(z.unknown()).optional()
});

/**
 * Get details for a specific practice session (for active practice)
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
    
    const sessionId = Number((await params).sessionId);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      userId, 
      `get-session-detail:${sessionId}`, 
      RATE_LIMITS.GET_SESSION_DETAIL
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const cacheKey = `session:${userId}:${sessionId}:active`;

    logger.debug('Fetching session details', {
      userId,
      context: 'practice-sessions/[sessionId].GET',
      data: { sessionId, cacheKey }
    });

    // Try to get from cache first
    const cachedData = await cache.get<SessionDetailResponse>(cacheKey);
    if (cachedData) {
      logger.debug('Cache hit for session details', {
        userId,
        context: 'practice-sessions/[sessionId].GET',
        data: { sessionId }
      });
      return NextResponse.json({ 
        ...cachedData,
        source: 'cache' 
      });
    }

    // Get session details with subject, topic, and subtopic names for context
    const sessionDataFromDb = await db.query.practice_sessions.findFirst({
      where: and(
        eq(practice_sessions.session_id, sessionId),
        eq(practice_sessions.user_id, userId)
      ),
      columns: {
        session_id: true,
        session_type: true,
        start_time: true,
        end_time: true,
        duration_minutes: true,
        total_questions: true,
        questions_attempted: true,
        questions_correct: true,
        score: true,
        max_score: true,
        is_completed: true,
        notes: true,
        settings: true,
        subject_id: true,
        topic_id: true,
        subtopic_id: true
      },
      with: {
        subject: { 
          columns: { 
            subject_name: true, 
            subject_id: true 
          } 
        },
        topic: { 
          columns: { 
            topic_name: true, 
            topic_id: true 
          } 
        },
        subtopic: { 
          columns: { 
            subtopic_name: true, 
            subtopic_id: true 
          } 
        }
      }
    });

    if (!sessionDataFromDb) {
      logger.warn('Session not found', {
        userId,
        context: 'practice-sessions/[sessionId].GET',
        data: { sessionId }
      });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const formattedSession: SessionDetail = {
      session_id: sessionDataFromDb.session_id,
      session_type: sessionDataFromDb.session_type,
      start_time: sessionDataFromDb.start_time,
      end_time: sessionDataFromDb.end_time ?? undefined,
      duration_minutes: sessionDataFromDb.duration_minutes ?? undefined,
      total_questions: sessionDataFromDb.total_questions ?? 0,
      questions_attempted: sessionDataFromDb.questions_attempted ?? 0,
      questions_correct: sessionDataFromDb.questions_correct ?? 0,
      score: sessionDataFromDb.score ?? undefined,
      max_score: sessionDataFromDb.max_score ?? undefined,
      is_completed: sessionDataFromDb.is_completed ?? false,
      notes: sessionDataFromDb.notes ?? undefined,
      settings: sessionDataFromDb.settings as Record<string, unknown> | undefined,
      subject_id: sessionDataFromDb.subject?.subject_id ?? sessionDataFromDb.subject_id ?? undefined,
      subject_name: sessionDataFromDb.subject?.subject_name ?? undefined,
      topic_id: sessionDataFromDb.topic?.topic_id ?? undefined,
      topic_name: sessionDataFromDb.topic?.topic_name ?? undefined,
      subtopic_id: sessionDataFromDb.subtopic?.subtopic_id ?? undefined,
      subtopic_name: sessionDataFromDb.subtopic?.subtopic_name ?? undefined,
    };

    const sessionQuestionsDataFromDb = await db
      .select({
        session_question_id: session_questions.session_question_id,
        question_order: session_questions.question_order,
        is_bookmarked: session_questions.is_bookmarked,
        time_spent_seconds: session_questions.time_spent_seconds,
        
        question_id: questions.question_id,
        question_text: questions.question_text,
        question_type: questions.question_type,
        details: questions.details, 
        explanation: questions.explanation, 
        difficulty_level: questions.difficulty_level,
        marks: questions.marks, 
        negative_marks: questions.negative_marks, 
        
        question_topic_id: questions.topic_id,
        question_topic_name: topics.topic_name,
        question_subtopic_id: questions.subtopic_id,
        question_subtopic_name: subtopics.subtopic_name,
      })
      .from(session_questions)
      .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
      .leftJoin(topics, eq(questions.topic_id, topics.topic_id))
      .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
      .where(eq(session_questions.session_id, sessionId))
      .orderBy(session_questions.question_order);

    const sessionQuestions: SessionQuestionDetail[] = sessionQuestionsDataFromDb.map(sq => ({
      session_question_id: sq.session_question_id,
      question_order: sq.question_order,
      is_bookmarked: sq.is_bookmarked ?? false,
      time_spent_seconds: sq.time_spent_seconds ?? 0,
      question: {
        question_id: sq.question_id,
        question_text: sq.question_text,
        question_type: sq.question_type,
        details: sq.details,
        explanation: sq.explanation,
        difficulty_level: sq.difficulty_level,
        marks: sq.marks,
        negative_marks: sq.negative_marks,
        topic_id: sq.question_topic_id,
        topic_name: sq.question_topic_name,
        subtopic_id: sq.question_subtopic_id,
        subtopic_name: sq.question_subtopic_name ?? null
      }
    }));
    
    const dataToCache: SessionDetailResponse = { 
      session: formattedSession, 
      questions: sessionQuestions 
    };
    
    // Cache the result
    await cache.set(cacheKey, dataToCache, CACHE_TTLS.SESSION_DETAIL_CACHE);
    // Track this cache key for the user
    await cacheService.trackCacheKey(userId, cacheKey);

    logger.info('Fetched session details', {
      userId,
      context: 'practice-sessions/[sessionId].GET',
      data: { 
        sessionId, 
        questionCount: sessionQuestions.length 
      }
    });

    return NextResponse.json({ 
      ...dataToCache, 
      source: 'database' 
    });
  } catch (error) {
    logger.error('Error fetching session details', {
      context: 'practice-sessions/[sessionId].GET',
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching session details.' }, 
      { status: 500 }
    );
  }
}

/**
 * Update session details (e.g., mark as completed)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = Number((await params).sessionId);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      userId, 
      `update-session-detail:${sessionId}`, 
      RATE_LIMITS.UPDATE_SESSION_DETAIL
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse request body
    let requestData: UpdateSessionDetailRequest;
    try {
      requestData = await request.json();
    } catch (e) {
      logger.error('Error parsing JSON', {
        userId,
        context: 'practice-sessions/[sessionId].PATCH',
        error: e instanceof Error ? e.message : String(e)
      });
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Validate request data
    try {
      sessionUpdateSchema.parse(requestData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        logger.warn('Validation error in session update', {
          userId,
          context: 'practice-sessions/[sessionId].PATCH',
          data: { 
            sessionId,
            errors: validationError.errors
          }
        });
        
        return NextResponse.json(
          { 
            error: 'Invalid session update parameters',
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }, 
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Verify session exists and belongs to user
    const [existingSession] = await db
      .select()
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.session_id, sessionId),
          eq(practice_sessions.user_id, userId)
        )
      );

    if (!existingSession) {
      logger.warn('Session not found or unauthorized for update', {
        userId,
        context: 'practice-sessions/[sessionId].PATCH',
        data: { sessionId }
      });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Set updated_at timestamp
    requestData.updated_at = new Date();

    // Update session
    const [updatedSession] = await db
      .update(practice_sessions)
      .set(requestData)
      .where(eq(practice_sessions.session_id, sessionId))
      .returning();

    // Invalidate session cache with the service
    await cacheService.invalidateUserSessionCaches(userId, sessionId);

    logger.info('Updated session', {
      userId,
      context: 'practice-sessions/[sessionId].PATCH',
      data: { 
        sessionId,
        is_completed: requestData.is_completed
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    logger.error('Error updating session', {
      context: 'practice-sessions/[sessionId].PATCH',
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating the session.' }, 
      { status: 500 }
    );
  }
}

/**
 * Delete a session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = Number((await params).sessionId);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Apply rate limiting for deletions
    const rateLimitResponse = await applyRateLimit(
      userId, 
      `delete-session:${sessionId}`, 
      RATE_LIMITS.DELETE_SESSION
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Verify session exists and belongs to user
    const [existingSession] = await db
      .select()
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.session_id, sessionId),
          eq(practice_sessions.user_id, userId)
        )
      );

    if (!existingSession) {
      logger.warn('Session not found or unauthorized for deletion', {
        userId,
        context: 'practice-sessions/[sessionId].DELETE',
        data: { sessionId }
      });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Delete session (cascades to session_questions due to FK constraint)
    await db
      .delete(practice_sessions)
      .where(eq(practice_sessions.session_id, sessionId));

    // Invalidate session cache with the service
    await cacheService.invalidateUserSessionCaches(userId, sessionId);

    logger.info('Deleted session', {
      userId,
      context: 'practice-sessions/[sessionId].DELETE',
      data: { sessionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting session', {
      context: 'practice-sessions/[sessionId].DELETE',
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting the session.' }, 
      { status: 500 }
    );
  }
}