// src/app/api/practice-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {  count } from 'drizzle-orm';
import { 
  practice_sessions, 
  questions, 
  topics, 
  subtopics, 
  subjects,
  session_questions,
  user_subscriptions,
  subscription_plans
} from '@/db/schema';
import { and, eq, desc, isNull, inArray } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { cache } from '@/lib/cache';
import { 
  checkSubscriptionLimitServerAction, 
  incrementTestUsage 
} from '@/lib/middleware/subscriptionMiddleware';
// Add rate limiting imports
import { RateLimiter } from '@/lib/rate-limiter';
// Optional - only if you're using Next.js App Router
import { revalidatePath, revalidateTag } from 'next/cache';

// Define rate limit configurations
const RATE_LIMITS = {
  CREATE_SESSION: { points: 20, duration: 60 * 60 }, // 10 requests per hour
  GET_SESSIONS: { points: 120, duration: 60 }, // 60 requests per minute
  UPDATE_SESSION: { points: 60, duration: 60 } // 30 requests per minute
};

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

// Create a new practice session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimiter = new RateLimiter(`create-session:${userId}`, RATE_LIMITS.CREATE_SESSION.points, RATE_LIMITS.CREATE_SESSION.duration);
    const rateLimitResult = await rateLimiter.consume();
    
    if (!rateLimitResult.success) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter)
        }
      });
    }

    // Generate idempotency key from request or headers
    const idempotencyKey = request.headers.get('x-idempotency-key') || 
                          crypto.randomUUID();
    
    // Check if we've already processed this request
    const cacheKey = `idempotency:${userId}:${idempotencyKey}`;
    const cachedResponse = await cache.get(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, { status: 200 });
    }

    // Check subscription limits before creating a new session
    const subscriptionCheck = await checkSubscriptionLimitServerAction(userId);
    if (!subscriptionCheck.success) {
      return NextResponse.json({
        error: subscriptionCheck.message,
        limitReached: subscriptionCheck.limitReached,
        upgradeRequired: true
      }, { status: 403 });
    }

    // Try to get data from request body or URL parameters
    let requestData;
    const requestBody = await request.text(); // Read the request body as text
    
    if (requestBody) {
      try {
        requestData = await request.json();
        console.log('Using JSON body:', requestData);
      } catch (e) {
        // If JSON parsing fails, try to get from URL parameters
        console.log('Error parsing JSON, trying URL parameters:', e);
        // Proceed to extract parameters from URL
      }
    }
    
    if (!requestBody || !requestData) {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse and validate numeric parameters
      const subject_id = searchParams.has('subject_id') ? 
        Number(searchParams.get('subject_id')) : undefined;
      
      // Check if subject_id is a valid number
      if (subject_id === undefined || Number.isNaN(subject_id)) {
        return NextResponse.json({ 
          error: 'Invalid subject_id parameter: must be a valid number' 
        }, { status: 400 });
      }
      
      // Parse and validate other numeric parameters
      let topic_id, subtopic_id, duration_minutes, question_count;
      
      if (searchParams.has('topic_id')) {
        topic_id = Number(searchParams.get('topic_id'));
        if (Number.isNaN(topic_id)) {
          return NextResponse.json({ 
            error: 'Invalid topic_id parameter: must be a valid number' 
          }, { status: 400 });
        }
      }
      
      if (searchParams.has('subtopic_id')) {
        subtopic_id = Number(searchParams.get('subtopic_id'));
        if (Number.isNaN(subtopic_id)) {
          return NextResponse.json({ 
            error: 'Invalid subtopic_id parameter: must be a valid number' 
          }, { status: 400 });
        }
      }
      
      if (searchParams.has('duration_minutes')) {
        duration_minutes = Number(searchParams.get('duration_minutes'));
        if (Number.isNaN(duration_minutes)) {
          return NextResponse.json({ 
            error: 'Invalid duration_minutes parameter: must be a valid number' 
          }, { status: 400 });
        }
      }
      
      if (searchParams.has('question_count')) {
        question_count = Number(searchParams.get('question_count'));
        if (Number.isNaN(question_count)) {
          return NextResponse.json({ 
            error: 'Invalid question_count parameter: must be a valid number' 
          }, { status: 400 });
        }
      } else {
        question_count = 10; // Default value
      }
      
      const session_type = searchParams.get('session_type') || 'Practice';
      // Validate session_type
      if (!['Practice', 'Test', 'Review', 'Custom'].includes(session_type)) {
        return NextResponse.json({ 
          error: 'Invalid session_type parameter: must be one of Practice, Test, Review, Custom' 
        }, { status: 400 });
      }
      
      requestData = {
        subject_id,
        topic_id,
        subtopic_id,
        session_type,
        duration_minutes,
        question_count
      };
      
      console.log('Using URL parameters:', requestData);
    }

    // Validate the data using the schema
    try {
      const validatedData = createSessionSchema.parse(requestData);
      console.log('Validated data:', validatedData);
      
      // Use a transaction for the entire session creation process
      const result = await db.transaction(async (tx) => {
        // Create new session in database
        const [newSession] = await tx.insert(practice_sessions).values({
          user_id: userId,
          subject_id: validatedData.subject_id,
          topic_id: validatedData.topic_id,
          subtopic_id: validatedData.subtopic_id,
          session_type: validatedData.session_type,
          duration_minutes: validatedData.duration_minutes,
          total_questions: validatedData.question_count,
          questions_attempted: 0,
          questions_correct: 0,
          is_completed: false,
          start_time: new Date()
        }).returning();

        // Get personalized questions
        const sessionQuestions = await getPersonalizedQuestions(
          userId, 
          validatedData.subject_id, 
          validatedData.topic_id, 
          validatedData.subtopic_id, 
          validatedData.question_count
        );

        // Check if we have enough questions
        if (sessionQuestions.length === 0) {
          throw new Error('No questions available for the selected criteria');
        }

        // Use a Set to track question IDs and prevent duplicates
        const questionIdSet = new Set<number>();
        const valuesToInsert: {
          session_id: number;
          question_id: number;
          question_order: number;
          is_bookmarked: boolean;
          time_spent_seconds: number;
          user_id: string;
          topic_id: number;
        }[] = [];
        
        sessionQuestions.forEach((question, index) => {
          // Skip duplicate questions
          if (questionIdSet.has(question.question_id)) {
            return;
          }
          
          questionIdSet.add(question.question_id);
          valuesToInsert.push({
            session_id: newSession.session_id,
            question_id: question.question_id,
            question_order: index + 1,
            is_bookmarked: false,
            time_spent_seconds: 0,
            user_id: userId,
            topic_id: question.topic_id
          });
        });
        
        // Insert questions sequentially within the transaction
        for (const values of valuesToInsert) {
          await tx.insert(session_questions).values(values);
        }

        return {
          sessionId: newSession.session_id,
          questions: sessionQuestions
        };
      });

      // Increment test usage for subscription tracking
      await incrementTestUsage(userId);

      // Invalidate user's practice sessions list cache
      await invalidateUserSessionCaches(userId);

      // Store the result in the idempotency cache
      await cache.set(cacheKey, result, 3600); // Cache for 1 hour

      return NextResponse.json(result);
      
    } catch (e) {
      console.error('Validation error:', e);
      
      // If it's a Zod error, provide more focused information
      if (e instanceof z.ZodError) {
        console.error('Failed fields:', e.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        })));
        
        return NextResponse.json(
          { 
            error: 'Invalid session parameters',
            details: e.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
            // Remove requestData from response
          }, 
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Invalid session parameters',
          message: e instanceof Error ? e.message : String(e)
          // Remove detailed error stack traces
        }, 
        { status: 400 }
      );
    }
  } catch (e) {
    console.error('Unexpected error in practice session creation:', e);
    
    // Check if it's a database constraint error
    if (e instanceof Error && e.message.includes('23505')) {
      return NextResponse.json(
        { 
          message: "Duplicate session or questions detected",
          error: "A constraint violation occurred. Please try again."
          // Generic message instead of raw DB error
        },
        { status: 409 }, // Conflict status code
      );
    }
    
    // Provide generic error message without exposing implementation details
    return NextResponse.json(
      { 
        message: "Failed to create practice session",
        error: "An unexpected error occurred"
        // Don't include raw error message in production
      },
      { status: 500 },
    );
  }
}

// Get all practice sessions for a user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add more detailed logging
    console.log(`Getting practice sessions for user ${userId}`);

    // Apply rate limiting with better error handling
    const rateLimiter = new RateLimiter(`get-sessions:${userId}`, RATE_LIMITS.GET_SESSIONS.points, RATE_LIMITS.GET_SESSIONS.duration);
    const rateLimitResult = await rateLimiter.consume();
    
    if (!rateLimitResult.success) {
      console.log(`Rate limit exceeded for user ${userId}. Retry after ${rateLimitResult.retryAfter} seconds`);
      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter)
        }
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Create a cache key based on user ID and pagination parameters
    const cacheKey = `api:practice-sessions:user:${userId}:limit:${limit}:offset:${offset}`;
    
    // Log cache access
    console.log(`Checking cache for key: ${cacheKey}`);
    
    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return NextResponse.json({
        ...cachedData,
        source: 'cache'
      });
    }
    
    console.log(`Cache miss for key: ${cacheKey}, querying database`);

    // Add timeouts or connection handling
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

      const total: number = Number(countResult[0]?.count) || 0;
      
      // This is the missing part - define the result object
      const result = {
        sessions,
        pagination: {
          total,
          limit,
          offset
        }
      };
      
      console.log(`Successfully fetched ${sessions.length} sessions for user ${userId}`);
      
      // Cache the result
      await cache.set(cacheKey, result, 300);
      
      return NextResponse.json({
        ...result,
        source: 'database'
      });
    } catch (dbError) {
      // Specific handling for database errors
      console.error('Database error fetching practice sessions:', dbError);
      
      // Check if we have stale cache available
      const staleCache = await cache.get(cacheKey);
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
    console.error('Error fetching practice sessions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch practice sessions',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'SESSION_FETCH_ERROR'
    }, { status: 500 });
  }
}

// Add an endpoint to get a specific practice session with its questions
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimiter = new RateLimiter(`update-session:${userId}`, RATE_LIMITS.UPDATE_SESSION.points, RATE_LIMITS.UPDATE_SESSION.duration);
    const rateLimitResult = await rateLimiter.consume();
    
    if (!rateLimitResult.success) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter)
        }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { sessionId, isCompleted, questionsAttempted, questionsCorrect, score } = body;

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

    // Invalidate all session cache entries for a user
    await invalidateUserSessionCaches(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating practice session:', error);
    return NextResponse.json({ 
      error: 'Failed to update practice session'
      // Don't include raw error details
    }, { status: 500 });
  }
}

// Helper function to get personalized questions with caching for question pools
async function getPersonalizedQuestions(
  userId: string, 
  subjectId: number, 
  topicId?: number, 
  subtopicId?: number, 
  questionCount: number = 10
) {
  // Define a type for the question object that matches the database query result
  interface QuestionWithDetails {
    question_id: number;
    question_text: string;
    question_type: "MultipleChoice" | "Matching" | "MultipleCorrectStatements" | "AssertionReason" | "DiagramBased" | "SequenceOrdering";
    details: unknown;
    explanation: string | null;
    difficulty_level: string | null;
    marks: number;
    negative_marks: number;
    topic_id: number;
    topic_name: string;
    subtopic_id: number | null;
    subtopic_name: string | null;
    source_type: string;
  }
  
  // Check if this is a free user practicing botany
  const isBotanySubject = subjectId === 3; // Biology subject ID
  const userSubscription = await db
    .select({
      plan_code: subscription_plans.plan_code
    })
    .from(user_subscriptions)
    .innerJoin(
      subscription_plans,
      eq(user_subscriptions.plan_id, subscription_plans.plan_id)
    )
    .where(eq(user_subscriptions.user_id, userId))
    .limit(1)
    .then(rows => rows[0])
    .catch(error => {
      console.error("Error fetching user subscription:", error);
      return null; // Or some other appropriate default value
    });
  
  const isFreemiumUser = !userSubscription || (userSubscription && userSubscription.plan_code === 'free');
  
  // Cache key for the potential questions pool - include source_type in cache key
  const poolCacheKey = `questions:pool:subject:${subjectId}:topic:${topicId}:subtopic:${subtopicId}:source:AI_Generated`;
  
  // Try to get the potential questions pool from cache
  let potentialQuestions = await cache.get<QuestionWithDetails[]>(poolCacheKey);
  
  if (!potentialQuestions) {
    // Cache miss - execute query to get potential questions
    // Base query: include questions from the specified subject
    const baseQuery = db.select({
      question_id: questions.question_id,
      question_text: questions.question_text,
      question_type: questions.question_type,
      details: questions.details,
      explanation: questions.explanation,
      difficulty_level: questions.difficulty_level,
      marks: questions.marks ?? 0,
      negative_marks: questions.negative_marks ?? 0,
      topic_id: topics.topic_id,
      topic_name: topics.topic_name,
      subtopic_id: subtopics.subtopic_id,
      subtopic_name: subtopics.subtopic_name,
      source_type: questions.source_type,
    })
    .from(questions)
    .innerJoin(topics, eq(questions.topic_id, topics.topic_id))
    .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id));
    
    // Build conditions array
    const conditions = [
      eq(questions.subject_id, subjectId),
      eq(questions.source_type, 'AI_Generated')
    ];
    
    // Add topic filter if specified
    if (topicId) {
      conditions.push(eq(questions.topic_id, topicId));
    }
    
    // Add subtopic filter if specified
    if (subtopicId) {
      conditions.push(eq(questions.subtopic_id, subtopicId));
    }
    
    // For free users practicing botany, restrict to first two topics
    if (isBotanySubject && isFreemiumUser && !topicId) {
      // Get the first two topic IDs
      const freemiumTopics = await db
        .select({ topic_id: topics.topic_id })
        .from(topics)
        .where(
          and(
            eq(topics.subject_id, subjectId),
            eq(topics.is_active, true),
            isNull(topics.parent_topic_id)
          )
        )
        .orderBy(topics.topic_id)
        .limit(2);
      
      if (freemiumTopics.length > 0) {
        conditions.push(
          inArray(
            questions.topic_id, 
            freemiumTopics.map(t => t.topic_id)
          )
        );
      }
    }
    
    // Apply all conditions with 'and'
    const queryResults = await baseQuery.where(and(...conditions));
    
    // Ensure marks and negative_marks are always numbers
    potentialQuestions = queryResults.map(q => ({
      ...q,
      marks: q.marks ?? 0,
      negative_marks: q.negative_marks ?? 0
    }));
    
    // Cache the potential questions pool for future use
    await cache.set(poolCacheKey, potentialQuestions, 3600); // Cache for 1 hour
  }
  
  // For free users practicing botany without a specific topic,
  // filter cached questions to only include first two topics
  if (isBotanySubject && isFreemiumUser && !topicId && potentialQuestions) {
    const freemiumTopics = await db
      .select({ topic_id: topics.topic_id })
      .from(topics)
      .where(
        and(
          eq(topics.subject_id, subjectId),
          eq(topics.is_active, true),
          isNull(topics.parent_topic_id)
        )
      )
      .orderBy(topics.topic_id)
      .limit(2);
    
    const freemiumTopicIds = new Set(freemiumTopics.map(t => t.topic_id));
    potentialQuestions = potentialQuestions.filter(q => freemiumTopicIds.has(q.topic_id));
  }
  
  // Make sure potentialQuestions is an array before spreading
  const questionsArray = Array.isArray(potentialQuestions) ? potentialQuestions : [];
  const shuffled = [...questionsArray].sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffled.slice(0, questionCount);
  
  return selectedQuestions;
}

// Helper function to invalidate all session cache entries for a user
async function invalidateUserSessionCaches(userId: string) {
  try {
    // Add verbose logging to track what's happening
    console.log(`Starting cache invalidation for user ${userId}`);
    
    const patterns = [
      `api:practice-sessions:user:${userId}:*`,
      `session:${userId}:*`,
      `user:${userId}:subscription`,
      `user:${userId}:tests:*`,
      `idempotency:${userId}:*`
    ];
    
    // Delete each pattern individually with error handling
    for (const pattern of patterns) {
      try {
        const count = await cache.deletePattern(pattern);
        console.log(`Deleted ${count} keys matching pattern ${pattern}`);
      } catch (patternError) {
        console.error(`Error deleting pattern ${pattern}:`, patternError);
        // Continue with other patterns
      }
    }
    
    // Add the revalidation calls
    if (typeof revalidatePath === 'function') {
      revalidatePath('/dashboard');
      revalidatePath('/practice');
      revalidatePath('/sessions');
    }
    
    console.log(`Cache invalidation completed for user ${userId}`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

// When creating a new cache entry, track it for later invalidation
// This function would be called whenever a new cache entry is created
/*async function trackCacheKey(userId: string, cacheKey: string) {
  try {
    const userKeysSetKey = `user:${userId}:cache-keys`;
    const existingKeys = await cache.get(userKeysSetKey) || [];
    // Add the new key if it doesn't exist
    if (Array.isArray(existingKeys)) {
      if (!existingKeys.includes(cacheKey)) {
        existingKeys.push(cacheKey);
        await cache.set(userKeysSetKey, existingKeys, 86400); // 24 hours TTL
      }
    } else {
      // Initialize as array if not already
      await cache.set(userKeysSetKey, [cacheKey], 86400); // 24 hours TTL
    }
  } catch (error) {
    console.error('Error tracking cache key:', error);
    // Non-critical operation, continue execution
  }
}
*/
