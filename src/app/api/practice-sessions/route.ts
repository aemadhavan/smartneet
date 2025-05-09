// src/app/api/practice-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry } from '@/db';
import { sql } from 'drizzle-orm';
import { 
  practice_sessions, 
  questions, 
  topics, 
  subtopics, 
  subjects,
  session_questions
} from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { cache } from '@/lib/cache';
import { 
  checkSubscriptionLimitServerAction, 
  incrementTestUsage 
} from '@/lib/middleware/subscriptionMiddleware';
// Optional - only if you're using Next.js App Router
import { revalidatePath, revalidateTag } from 'next/cache';

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
    try {
      requestData = await request.json();
      console.log('Using JSON body:', requestData);
    } catch (e) {
      // If JSON parsing fails, try to get from URL parameters
      console.log('Error parsing JSON, trying URL parameters:', e);
      const searchParams = request.nextUrl.searchParams;
      
      // Parse and validate numeric parameters
      const subject_id = searchParams.has('subject_id') ? 
        Number(searchParams.get('subject_id')) : undefined;
      
      // Check if subject_id is a valid number
      if (subject_id === undefined || isNaN(subject_id)) {
        return NextResponse.json({ 
          error: 'Invalid subject_id parameter: must be a valid number' 
        }, { status: 400 });
      }
      
      // Parse and validate other numeric parameters
      let topic_id, subtopic_id, duration_minutes, question_count;
      
      if (searchParams.has('topic_id')) {
        topic_id = Number(searchParams.get('topic_id'));
        if (isNaN(topic_id)) {
          return NextResponse.json({ 
            error: 'Invalid topic_id parameter: must be a valid number' 
          }, { status: 400 });
        }
      }
      
      if (searchParams.has('subtopic_id')) {
        subtopic_id = Number(searchParams.get('subtopic_id'));
        if (isNaN(subtopic_id)) {
          return NextResponse.json({ 
            error: 'Invalid subtopic_id parameter: must be a valid number' 
          }, { status: 400 });
        }
      }
      
      if (searchParams.has('duration_minutes')) {
        duration_minutes = Number(searchParams.get('duration_minutes'));
        if (isNaN(duration_minutes)) {
          return NextResponse.json({ 
            error: 'Invalid duration_minutes parameter: must be a valid number' 
          }, { status: 400 });
        }
      }
      
      if (searchParams.has('question_count')) {
        question_count = Number(searchParams.get('question_count'));
        if (isNaN(question_count)) {
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
      
      // Create new session in database
      const [newSession] = await withRetry(async () => {
        return db.insert(practice_sessions).values({
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
      });

      // Get personalized questions based on user's history and chosen parameters
      const sessionQuestions = await withRetry(async () => {
        return getPersonalizedQuestions(
          userId, 
          validatedData.subject_id, 
          validatedData.topic_id, 
          validatedData.subtopic_id, 
          validatedData.question_count
        );
      });

      // Check if we have enough questions
      if (sessionQuestions.length === 0) {
        // Clean up the created session since we don't have questions
        await db.delete(practice_sessions)
          .where(eq(practice_sessions.session_id, newSession.session_id));
        
        return NextResponse.json({ 
          error: 'No questions available for the selected criteria' 
        }, { status: 404 });
      }

      // Add questions to the session
      await withRetry(async () => {
        return Promise.all(sessionQuestions.map((question, index) => 
          db.insert(session_questions).values({
            session_id: newSession.session_id,
            question_id: question.question_id,
            question_order: index + 1,
            is_bookmarked: false,
            time_spent_seconds: 0,
            user_id: userId,
            topic_id: question.topic_id
          })
        ));
      });

      // Increment test usage for subscription tracking
      await incrementTestUsage(userId);

      // Invalidate user's practice sessions list cache
      await invalidateUserSessionCaches(userId);

      return NextResponse.json({
        sessionId: newSession.session_id,
        questions: sessionQuestions
      });
      
    } catch (e) {
      console.error('Validation error:', e);
      
      // If it's a Zod error, provide more detailed information
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
            })),
            requestData: requestData // Include this for debugging
          }, 
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Invalid session parameters',
          message: e instanceof Error ? e.message : String(e)
        }, 
        { status: 400 }
      );
    }
  } catch (e) {
    console.error('Unexpected error in practice session creation:', e);
    return NextResponse.json(
      { 
        message: "Failed to create practice session",
        error: e instanceof Error ? e.message : "Unknown error"
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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Create a cache key based on user ID and pagination parameters
    const cacheKey = `api:practice-sessions:user:${userId}:limit:${limit}:offset:${offset}`;
    
    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        source: 'cache'
      });
    }

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

    // Get total count using SQL count function
    const countResult = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(practice_sessions)
      .where(eq(practice_sessions.user_id, userId));

    const total: number = countResult[0]?.count || 0;
    
    const result = {
      sessions,
      pagination: {
        total,
        limit,
        offset
      }
    };
    
    // Cache the result, but with a shorter TTL since this is user-specific activity data
    await cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return NextResponse.json({
      ...result,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching practice sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch practice sessions' }, { status: 500 });
  }
}

// Add an endpoint to get a specific practice session with its questions
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    return NextResponse.json({ error: 'Failed to update practice session' }, { status: 500 });
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
    difficulty_level: string | null; // Make nullable to match database schema
    marks: number;
    negative_marks: number;
    topic_id: number;
    topic_name: string;
    subtopic_id: number | null;
    subtopic_name: string | null;
    source_type: string; // Add source_type field
  }
  
  // Cache key for the potential questions pool - include source_type in cache key
  const poolCacheKey = `questions:pool:subject:${subjectId}:topic:${topicId}:subtopic:${subtopicId}:source:AI_Generated`;
  
  // Try to get the potential questions pool from cache
  let potentialQuestions = await cache.get<QuestionWithDetails[]>(poolCacheKey);
  
  if (!potentialQuestions) {
    // Cache miss - execute query to get potential questions
    // Query to build the set of questions
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
      source_type: questions.source_type, // Select source_type field
    })
    .from(questions)
    .innerJoin(topics, eq(questions.topic_id, topics.topic_id))
    .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id));
    
    // Build conditions array
    const conditions = [
      eq(questions.subject_id, subjectId),
      eq(questions.source_type, 'AI_Generated') // Add filter for AI_Generated questions
    ];
    
    // Add topic filter if specified
    if (topicId) {
      conditions.push(eq(questions.topic_id, topicId));
    }
    
    // Add subtopic filter if specified
    if (subtopicId) {
      conditions.push(eq(questions.subtopic_id, subtopicId));
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
    // Questions change less frequently, so we can cache longer
    await cache.set(poolCacheKey, potentialQuestions, 3600); // Cache for 1 hour
  }
  
  // Now that we have the potential questions (either from cache or database),
  // we need to personalize them for this specific user
  
  // In a real implementation, we would apply more sophisticated logic:
  // 1. Check user's question_attempts to identify weak areas
  // 2. Balance questions across difficulty levels
  // 3. Prioritize topics with lower mastery_level
  // 4. Include some previously incorrect questions for reinforcement
  
  // For now, we'll just randomize the order and take the requested count
  // Note: We don't cache this personalized selection since it should be different each time
  // Make sure potentialQuestions is an array before spreading
  const questionsArray = Array.isArray(potentialQuestions) ? potentialQuestions : [];
  const shuffled = [...questionsArray].sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffled.slice(0, questionCount);
  
  return selectedQuestions;
}
// Helper function to invalidate all session cache entries for a user
async function invalidateUserSessionCaches(userId: string) {
  // Delete the main cache key
  await cache.delete(`api:practice-sessions:user:${userId}`);
  
  // Delete common pagination variants
  await cache.delete(`api:practice-sessions:user:${userId}:limit:10:offset:0`);
  await cache.delete(`api:practice-sessions:user:${userId}:limit:10:offset:0`);
  
  // Invalidate subscription-related caches
  await cache.delete(`user:${userId}:subscription`);
  await cache.delete(`user:${userId}:tests:today`);
  
  // If using Next.js App Router, use the imported functions for revalidation
  try {
    if (typeof revalidatePath === 'function') {
      revalidatePath('/dashboard');
      revalidatePath('/practice');
      revalidatePath('/sessions');
    }
    
    if (typeof revalidateTag === 'function') {
      revalidateTag('user-sessions');
      revalidateTag('subscription');
    }
  } catch (error) {
    // Silently handle if revalidation functions are not available
    console.log('Revalidation not available:', error);
  }
}
