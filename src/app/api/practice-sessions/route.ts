// src/app/api/practice-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { count } from 'drizzle-orm';
import { 
  practice_sessions, 
  subjects,
  topics
} from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { cache } from '@/lib/cache';
import { applyRateLimit, RATE_LIMITS, CACHE_TTLS } from '@/lib/middleware/rateLimitMiddleware';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/services/CacheService';
import { practiceSessionManager } from '@/lib/services/PracticeSessionManager';
import { 
  CreateSessionRequest, 
  UpdateSessionRequest, 
  PaginatedSessionsResponse,
  SessionResponse
} from '@/types/practice-sessions';

// Schema for validating session creation request
const createSessionSchema = z.object({
  subject_id: z.number({
    invalid_type_error: "subject_id must be a number",
    required_error: "subject_id is required"
  }),
  topic_id: z.number({
    invalid_type_error: "topic_id must be a number" 
  }).optional(),
  subtopic_id: z.number({
    invalid_type_error: "subtopic_id must be a number"
  }).optional(),
  session_type: z.enum(['Practice', 'Test', 'Review', 'Custom'], {
    invalid_type_error: "session_type must be one of: Practice, Test, Review, Custom",
    required_error: "session_type is required"
  }),
  duration_minutes: z.number({
    invalid_type_error: "duration_minutes must be a number"
  }).optional(),
  question_count: z.number({
    invalid_type_error: "question_count must be a number"
  }).default(10)
});

// Schema for validating session update request
const updateSessionSchema = z.object({
  sessionId: z.number({
    invalid_type_error: "sessionId must be a number",
    required_error: "sessionId is required"
  }),
  isCompleted: z.boolean().optional(),
  questionsAttempted: z.number().optional(),
  questionsCorrect: z.number().optional(),
  score: z.number().optional()
});

/**
 * Create a new practice session
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get idempotency key from header
    const idempotencyKey = request.headers.get('x-idempotency-key');

    // Apply rate limiting using middleware
    const rateLimitResponse = await applyRateLimit(
      userId, 
      'create-session', 
      RATE_LIMITS.CREATE_SESSION
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Expect JSON request body or query parameters
    let requestData: CreateSessionRequest;
    try {
      // First try to get data from request body
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        requestData = await request.json();
      } else {
        // If no JSON body, try to get from query parameters
        const searchParams = request.nextUrl.searchParams;
        requestData = {
          subject_id: parseInt(searchParams.get('subject_id') || '0'),
          session_type: searchParams.get('session_type') as 'Practice' | 'Test' | 'Review' | 'Custom',
          question_count: parseInt(searchParams.get('question_count') || '10')
        };
        
        // Add optional parameters if they exist
        const topicId = searchParams.get('topic_id');
        if (topicId) {
          requestData.topic_id = parseInt(topicId);
        }
        
        const subtopicId = searchParams.get('subtopic_id');
        if (subtopicId) {
          requestData.subtopic_id = parseInt(subtopicId);
        }
        
        const durationMinutes = searchParams.get('duration_minutes');
        if (durationMinutes) {
          requestData.duration_minutes = parseInt(durationMinutes);
        }
      }
    } catch (error) {
      logger.error('Error parsing request data', {
        userId,
        context: 'practice-sessions.POST',
        error: error instanceof Error ? error : String(error)
      });
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    // Validate the data using the schema
    try {
      const validatedData = createSessionSchema.parse(requestData);
      
      // Use the new PracticeSessionManager for robust session creation
      const result = await practiceSessionManager.createSession({
        userId,
        subjectId: validatedData.subject_id,
        topicId: validatedData.topic_id,
        subtopicId: validatedData.subtopic_id,
        questionCount: validatedData.question_count,
        sessionType: validatedData.session_type
      }, idempotencyKey || undefined);

      logger.info('Created new practice session via PracticeSessionManager', {
        userId,
        context: 'practice-sessions.POST',
        data: { 
          sessionId: result.sessionId,
          questionCount: result.questions.length,
          idempotencyKey: result.idempotencyKey
        }
      });

      return NextResponse.json({
        sessionId: result.sessionId,
        questions: result.questions
      });
    } catch (e) {
      // Check if it's a subscription limit error first
      if (e instanceof Error && (
        e.message.includes('daily limit') || 
        e.message.includes('subscription limit') ||
        e.message.includes('Cannot take test') ||
        e.message.includes('premium users') ||
        e.message.includes('upgrade to premium')
      )) {
        logger.warn('Session creation blocked due to subscription limits', {
          userId,
          context: 'practice-sessions.POST',
          error: e.message
        });
        
        return NextResponse.json(
          { 
            error: e.message,
            limitReached: true,
            upgradeRequired: e.message.includes('premium')
          }, 
          { status: 403 }
        );
      }
      
      // If it's a Zod error, provide more focused information
      if (e instanceof z.ZodError) {
        logger.warn('Validation error in session creation', {
          userId,
          context: 'practice-sessions.POST',
          data: { 
            errors: e.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          }
        });
        
        return NextResponse.json(
          { 
            error: 'Invalid session parameters',
            details: e.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }, 
          { status: 400 }
        );
      }
      
      // Log the detailed error for server-side inspection
      logger.error('Unexpected error in practice session creation', {
        userId,
        context: 'practice-sessions.POST',
        error: e instanceof Error ? e : String(e)
      });
      
      // Check if it's a database constraint error
      if (e instanceof Error && e.message.includes('23505')) {
        return NextResponse.json(
          { 
            message: "Duplicate session or questions detected",
            error: "A constraint violation occurred. Please try again."
          },
          { status: 409 }, // Conflict status code
        );
      }
      
      // Provide generic error message without exposing implementation details
      return NextResponse.json(
        { 
          message: "Failed to create practice session",
          error: "An unexpected error occurred"
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('Error creating practice session', {
      context: 'practice-sessions.POST',
      error: error instanceof Error ? error : String(error)
    });
    return NextResponse.json({ 
      error: 'Failed to create practice session'
    }, { status: 500 });
  }
}

/**
 * Get all practice sessions for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting with better error handling
    const rateLimitResponse = await applyRateLimit(
      userId, 
      'get-sessions', 
      RATE_LIMITS.GET_SESSIONS
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Create a cache key based on user ID and pagination parameters
    const cacheKey = `api:practice-sessions:user:${userId}:limit:${limit}:offset:${offset}`;
    
    logger.debug('Fetching sessions', {
      userId,
      context: 'practice-sessions.GET',
      data: { limit, offset, cacheKey }
    });
    
    // Try to get from cache first
    const cachedData = await cache.get<PaginatedSessionsResponse>(cacheKey);
    if (cachedData) {
      logger.debug('Cache hit for sessions', {
        userId,
        context: 'practice-sessions.GET',
        data: { cacheKey }
      });
      return NextResponse.json({
        ...cachedData,
        source: 'cache'
      });
    }

    try {
      // Get user's practice sessions
      const sessions = await db.select({
        session_id: practice_sessions.session_id,
        session_type: practice_sessions.session_type,
        start_time: practice_sessions.start_time,
        end_time: practice_sessions.end_time,
        duration_minutes: practice_sessions.duration_minutes,
        total_questions: practice_sessions.total_questions,
        questions_attempted: practice_sessions.questions_attempted,
        questions_correct: practice_sessions.questions_correct,
        score: practice_sessions.score,
        max_score: practice_sessions.max_score,
        is_completed: practice_sessions.is_completed,
        subject_name: subjects.subject_name,
        topic_name: topics.topic_name
      })
      .from(practice_sessions)
      .leftJoin(subjects, eq(practice_sessions.subject_id, subjects.subject_id))
      .leftJoin(topics, eq(practice_sessions.topic_id, topics.topic_id))
      .where(eq(practice_sessions.user_id, userId))
      .orderBy(desc(practice_sessions.start_time))
      .limit(limit)
      .offset(offset);

      // Get total count for pagination
      const countResult = await db
        .select({
          count: count(practice_sessions.session_id)
        })
        .from(practice_sessions)
        .where(eq(practice_sessions.user_id, userId));

      const total = Number(countResult[0]?.count || 0);
      
      // Map database results to SessionResponse type
      const mappedSessions: SessionResponse[] = sessions.map(session => ({
        session_id: session.session_id,
        session_type: session.session_type,
        start_time: session.start_time,
        end_time: session.end_time || undefined,
        duration_minutes: session.duration_minutes || undefined,
        total_questions: session.total_questions ?? 0,
        questions_attempted: session.questions_attempted ?? 0,
        questions_correct: session.questions_correct ?? 0,
        score: session.score || undefined,
        max_score: session.max_score || undefined,
        is_completed: Boolean(session.is_completed),
        subject_name: session.subject_name || '',
        topic_name: session.topic_name || undefined
      }));
      
      // Define the result object
      const result: PaginatedSessionsResponse = {
        sessions: mappedSessions,
        pagination: {
          total,
          limit,
          offset
        }
      };
      
      logger.info('Fetched sessions', {
        userId,
        context: 'practice-sessions.GET',
        data: { sessionCount: sessions.length, total }
      });
      
      // Cache the result
      await cache.set(cacheKey, result, CACHE_TTLS.SESSION_CACHE);
      // Track this cache key for the user
      await cacheService.trackCacheKey(userId, cacheKey);
      
      return NextResponse.json({
        ...result,
        source: 'database'
      });
    } catch (dbError) {
      // Specific handling for database errors
      logger.error('Database error fetching practice sessions', {
        userId,
        context: 'practice-sessions.GET',
        error: dbError instanceof Error ? dbError : String(dbError)
      });
      
      // Check if we have stale cache available
      const staleCache = await cache.get<PaginatedSessionsResponse>(cacheKey);
      if (staleCache) {
        return NextResponse.json({
          ...staleCache,
          source: 'stale_cache',
          message: 'Database error, using cached data'
        }, { status: 503 });
      }
      
      throw dbError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    logger.error('Error fetching practice sessions', {
      context: 'practice-sessions.GET',
      error: error instanceof Error ? error : String(error)
    });
    return NextResponse.json({ 
      error: 'Failed to fetch practice sessions',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'SESSION_FETCH_ERROR'
    }, { status: 500 });
  }
}

/**
 * Update a practice session
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      userId, 
      'update-session', 
      RATE_LIMITS.UPDATE_SESSION
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let body: UpdateSessionRequest;
    try {
      body = await request.json();
    } catch (e) {
      logger.error('Error parsing JSON', {
        userId,
        context: 'practice-sessions.PATCH',
        error: e instanceof Error ? e : String(e)
      });
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Validate the update request
    try {
      const validatedData = updateSessionSchema.parse(body);
      const { sessionId, isCompleted, questionsAttempted, questionsCorrect, score } = validatedData;
      
      // First verify that this session belongs to the user
      const sessionCheck = await db
        .select({ session_id: practice_sessions.session_id })
        .from(practice_sessions)
        .where(
          and(
            eq(practice_sessions.session_id, sessionId),
            eq(practice_sessions.user_id, userId)
          )
        )
        .limit(1);
      
      if (sessionCheck.length === 0) {
        return NextResponse.json({ 
          error: 'Session not found or unauthorized' 
        }, { status: 404 });
      }

      // Update session in database
      await db.update(practice_sessions)
        .set({
          is_completed: isCompleted,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          score: score,
          end_time: isCompleted ? new Date() : undefined
        })
        .where(
          and(
            eq(practice_sessions.session_id, sessionId),
            eq(practice_sessions.user_id, userId)
          )
        );

      // Invalidate specific session cache entries
      await cacheService.invalidateUserSessionCaches(userId, sessionId);
      
      logger.info('Updated session', {
        userId,
        context: 'practice-sessions.PATCH',
        data: { 
          sessionId,
          isCompleted,
          questionsAttempted,
          questionsCorrect
        }
      });

      return NextResponse.json({ success: true });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Invalid session update parameters',
          details: validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      
      throw validationError;
    }
  } catch (error) {
    logger.error('Error updating practice session', {
      context: 'practice-sessions.PATCH',
      error: error instanceof Error ? error : String(error)
    });
    return NextResponse.json({ 
      error: 'Failed to update practice session'
    }, { status: 500 });
  }
}