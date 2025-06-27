// src/app/api/session-questions/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session_questions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { RATE_LIMITS, applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { 
  SessionQuestionLookupParams, 
  SessionQuestionLookupResponse,
  SessionQuestionError
} from '@/types/session-question';
import { cache } from '@/lib/cache';
import { CACHE_TTLS } from '@/lib/middleware/rateLimitMiddleware';

// Schema for validating lookup request
const lookupSchema = z.object({
  session_id: z.preprocess(
    (val) => parseInt(String(val), 10), // Ensure val is string before parseInt
    z.number({ invalid_type_error: "session_id must be a number" }).int().positive()
  ),
  question_id: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number({ invalid_type_error: "question_id must be a number" }).int().positive()
  ),
});

/**
 * Lookup a session question by session ID and question ID
 * Returns the session_question_id which is useful for other API calls
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      userId, 
      'session-question-lookup', 
      RATE_LIMITS.SESSION_QUESTION_LOOKUP
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get data from URL query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionIdParam = searchParams.get('session_id');
    const questionIdParam = searchParams.get('question_id');

    logger.debug('Session question lookup request', {
      userId,
      context: 'session-questions/lookup.GET',
      data: { sessionIdParam, questionIdParam }
    });

    // Validate the data
    const validationResult = lookupSchema.safeParse({
      session_id: sessionIdParam,
      question_id: questionIdParam,
    });

    if (!validationResult.success) {
      const errorDetails = validationResult.error.flatten().fieldErrors;
      logger.warn('Invalid session question lookup params', {
        userId,
        context: 'session-questions/lookup.GET',
        data: { errors: errorDetails }
      });
      
      return NextResponse.json({
        error: "Invalid input",
        details: errorDetails,
      } as SessionQuestionError, { status: 400 });
    }
    
    const validatedData: SessionQuestionLookupParams = validationResult.data;
    
    // Check cache first
    const cacheKey = `session:${userId}:${validatedData.session_id}:question:${validatedData.question_id}:lookup`;
    const cachedResult = await cache.get<SessionQuestionLookupResponse>(cacheKey);
    
    if (cachedResult) {
      logger.debug('Cache hit for session question lookup', {
        userId,
        context: 'session-questions/lookup.GET',
        data: { 
          sessionId: validatedData.session_id, 
          questionId: validatedData.question_id 
        }
      });
      return NextResponse.json(cachedResult);
    }
      
    // Look up the session question
    const [sessionQuestion] = await db
      .select({
        session_question_id: session_questions.session_question_id
      })
      .from(session_questions)
      .where(
        and(
          eq(session_questions.session_id, validatedData.session_id),
          eq(session_questions.question_id, validatedData.question_id),
          // Ensure the lookup is also scoped to the authenticated user for security
          eq(session_questions.user_id, userId) 
        )
      );

    if (!sessionQuestion) {
      logger.warn('Session question not found', {
        userId,
        context: 'session-questions/lookup.GET',
        data: { 
          sessionId: validatedData.session_id, 
          questionId: validatedData.question_id 
        }
      });
      
      return NextResponse.json({ 
        error: 'Session question not found for this user' 
      } as SessionQuestionError, { status: 404 });
    }

    // Create response object
    const response: SessionQuestionLookupResponse = {
      session_question_id: sessionQuestion.session_question_id
    };
    
    // Cache the result for future lookups
    try {
      await cache.set(cacheKey, response, CACHE_TTLS.SESSION_QUESTION_LOOKUP);
    } catch (cacheError) {
      // Log cache error but don't fail the request
      logger.warn('Failed to cache session question lookup result', {
        userId,
        context: 'session-questions/lookup.GET',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError)
      });
    }
    
    logger.debug('Successfully looked up session question', {
      userId,
      context: 'session-questions/lookup.GET',
      data: {
        sessionId: validatedData.session_id,
        questionId: validatedData.question_id,
        sessionQuestionId: sessionQuestion.session_question_id
      }
    });

    // Return the session_question_id
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error looking up session questions', {
      context: 'session-questions/lookup.GET',
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Since safeParse is used, this specific ZodError check is for any other potential Zod errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: error.flatten().fieldErrors
        } as SessionQuestionError, 
        { status: 400 }
      );
    }
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while looking up the session question.' } as SessionQuestionError,
      { status: 500 }
    );
  }
}