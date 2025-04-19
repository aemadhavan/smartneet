// src/app/api/practice-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
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

// Schema for validating session creation request
const createSessionSchema = z.object({
  subject_id: z.number(),
  topic_id: z.number().optional(),
  subtopic_id: z.number().optional(),
  session_type: z.enum(['Practice', 'Test', 'Review', 'Custom']),
  duration_minutes: z.number().optional(),
  question_count: z.number().default(20)
});

// Create a new practice session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    const validatedData = createSessionSchema.parse(requestData);

    // Create new session in database
    const [newSession] = await db.insert(practice_sessions).values({
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

    // Get personalized questions based on user's history and chosen parameters
    const sessionQuestions = await getPersonalizedQuestions(
      userId, 
      validatedData.subject_id, 
      validatedData.topic_id, 
      validatedData.subtopic_id, 
      validatedData.question_count
    );

    // Add questions to the session
    await Promise.all(sessionQuestions.map((question, index) => 
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

    // Invalidate user's practice sessions list cache
    await cache.delete(`api:practice-sessions:user:${userId}`);

    return NextResponse.json({
      sessionId: newSession.session_id,
      questions: sessionQuestions
    });
  } catch (error) {
    console.error('Error creating practice session:', error);
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.errors : 'Failed to create practice session' },
      { status: 400 }
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
      return NextResponse.json(cachedData);
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
    
    // Cache the result, but with a shorter TTL since this is user-specific activity data
    await cache.set(cacheKey, sessions, 300); // Cache for 5 minutes
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching practice sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch practice sessions' }, { status: 500 });
  }
}

// Helper function to get personalized questions with caching for question pools
async function getPersonalizedQuestions(
  userId: string, 
  subjectId: number, 
  topicId?: number, 
  subtopicId?: number, 
  questionCount: number = 20
) {
  // Cache key for the potential questions pool
  // Note: We don't include userId in this cache key because the potential
  // questions pool is the same for all users with the same parameters
  const poolCacheKey = `questions:pool:subject:${subjectId}:topic:${topicId}:subtopic:${subtopicId}`;
  
  // Try to get the potential questions pool from cache
  let potentialQuestions = await cache.get<any[]>(poolCacheKey);
  
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
      marks: questions.marks,
      negative_marks: questions.negative_marks,
      topic_id: topics.topic_id,
      topic_name: topics.topic_name,
      subtopic_id: subtopics.subtopic_id,
      subtopic_name: subtopics.subtopic_name
    })
    .from(questions)
    .innerJoin(topics, eq(questions.topic_id, topics.topic_id))
    .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id));
    
    // Build conditions array
    const conditions = [eq(questions.subject_id, subjectId)];
    
    // Add topic filter if specified
    if (topicId) {
      conditions.push(eq(questions.topic_id, topicId));
    }
    
    // Add subtopic filter if specified
    if (subtopicId) {
      conditions.push(eq(questions.subtopic_id, subtopicId));
    }
    
    // Apply all conditions with 'and'
    potentialQuestions = await baseQuery.where(and(...conditions));
    
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

// Add an endpoint to get a specific practice session with its questions
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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

    // Invalidate all session cache keys for this user
    await invalidateUserSessionCaches(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating practice session:', error);
    return NextResponse.json({ error: 'Failed to update practice session' }, { status: 500 });
  }
}

// Helper function to invalidate all session cache entries for a user
async function invalidateUserSessionCaches(userId: string) {
  // This is a simple approach - in a production environment with many cache keys,
  // you might want to use Redis pattern deletion if available
  await cache.delete(`api:practice-sessions:user:${userId}`);
  
  // If you need to be more specific with pagination parameters:
  // You could also delete specific pagination variants
  await cache.delete(`api:practice-sessions:user:${userId}:limit:10:offset:0`);
  await cache.delete(`api:practice-sessions:user:${userId}:limit:20:offset:0`);
  // etc.
}