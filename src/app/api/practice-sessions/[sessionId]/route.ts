// src/app/api/practice-sessions/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  practice_sessions, 
  session_questions,
  questions,
  // Import subjects table for session context
  subjects, 
  topics,
  subtopics
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache'; // Import cache

// Get details for a specific practice session (for active practice)
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

    const cacheKey = `session:${userId}:${sessionId}:active`;

    // Try to get from cache first
    const cachedData = await cache.get(cacheKey) as { session: unknown, questions: unknown[] } | null;
    if (cachedData) {
      return NextResponse.json({ 
        session: cachedData.session, 
        questions: cachedData.questions, 
        source: 'cache' 
      });
    }

    // First, get the practice session data
    const [sessionDataFromDb] = await db
      .select({
        // Practice session fields
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
        
        // Related data fields
        subject_id: practice_sessions.subject_id,
        subject_name: subjects.subject_name,
        topic_id: practice_sessions.topic_id,
        topic_name: topics.topic_name,
        subtopic_id: practice_sessions.subtopic_id,
        subtopic_name: subtopics.subtopic_name
      })
      .from(practice_sessions)
      .leftJoin(subjects, eq(practice_sessions.subject_id, subjects.subject_id))
      .leftJoin(topics, eq(practice_sessions.topic_id, topics.topic_id))
      .leftJoin(subtopics, eq(practice_sessions.subtopic_id, subtopics.subtopic_id))
      .where(and(
        eq(practice_sessions.session_id, sessionId),
        eq(practice_sessions.user_id, userId)
      ));

    if (!sessionDataFromDb) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Format the session data for the response
    const formattedSession = {
      session_id: sessionDataFromDb.session_id,
      session_type: sessionDataFromDb.session_type,
      start_time: sessionDataFromDb.start_time,
      end_time: sessionDataFromDb.end_time,
      duration_minutes: sessionDataFromDb.duration_minutes,
      total_questions: sessionDataFromDb.total_questions,
      questions_attempted: sessionDataFromDb.questions_attempted,
      questions_correct: sessionDataFromDb.questions_correct,
      score: sessionDataFromDb.score,
      max_score: sessionDataFromDb.max_score,
      status: sessionDataFromDb.is_completed ? 'completed' : 'active', // Derived status based on is_completed
      subject_id: sessionDataFromDb.subject_id,
      subject_name: sessionDataFromDb.subject_name,
      topic_id: sessionDataFromDb.topic_id,
      topic_name: sessionDataFromDb.topic_name,
      subtopic_id: sessionDataFromDb.subtopic_id,
      subtopic_name: sessionDataFromDb.subtopic_name,
    };

    // Get session questions with related data
    const sessionQuestionsDataFromDb = await db
      .select({
        session_question_id: session_questions.session_question_id,
        question_order: session_questions.question_order,
        is_bookmarked: session_questions.is_bookmarked, 
        time_spent_seconds: session_questions.time_spent_seconds, // Added this field
        
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

    // Format the questions data for the response
    const formattedQuestions = sessionQuestionsDataFromDb.map((sq) => ({
      session_question_id: sq.session_question_id,
      question_order: sq.question_order,
      is_bookmarked: sq.is_bookmarked,
      time_spent_seconds: sq.time_spent_seconds,
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
        subtopic_name: sq.question_subtopic_name,
      }
    }));
    
    const dataToCache = { session: formattedSession, questions: formattedQuestions };
    await cache.set(cacheKey, dataToCache, 600); // 600 seconds = 10 minutes

    return NextResponse.json({ 
      ...dataToCache, 
      source: 'database' 
    });
  } catch (error) {
    // Log the detailed error for server-side inspection
    console.error('Error fetching session details:', error instanceof Error ? error.message : String(error));
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching session details.' }, 
      { status: 500 }
    );
  }
}

// Update session details (e.g., mark as completed)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Await the auth call to get userId
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = Number((await params).sessionId);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const requestData = await request.json();

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
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session
    const [updatedSession] = await db
      .update(practice_sessions)
      .set({
        ...requestData,
        updated_at: new Date()
      })
      .where(eq(practice_sessions.session_id, sessionId))
      .returning();

    // Invalidate the cache for this session
    const cacheKey = `session:${userId}:${sessionId}:active`;
    await cache.delete(cacheKey);

    return NextResponse.json(updatedSession);
  } catch (error) {
    // Log the detailed error for server-side inspection
    console.error('Error updating session:', error instanceof Error ? error.message : String(error));
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating the session.' }, 
      { status: 500 }
    );
  }
}

// Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Await the auth call to get userId
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = Number((await params).sessionId);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
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
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Delete session (cascades to session_questions due to FK constraint)
    await db
      .delete(practice_sessions)
      .where(eq(practice_sessions.session_id, sessionId));
      
    // Invalidate the caches for this session
    const activeCacheKey = `session:${userId}:${sessionId}:active`;
    const reviewCacheKey = `session:${userId}:${sessionId}:review`;
    await cache.delete(activeCacheKey);
    await cache.delete(reviewCacheKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the detailed error for server-side inspection
    console.error('Error deleting session:', error instanceof Error ? error.message : String(error));
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting the session.' }, 
      { status: 500 }
    );
  }
}