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

// Get details for a specific practice session
export async function GET(
  request: NextRequest
) {
  try {
    // Await the auth call to get userId
    const { userId } = await auth();
    

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const pathname = request.nextUrl.pathname;
    const match = pathname.match(/\/practice-sessions\/(\d+)/);
    const sessionId = match ? parseInt(match[1], 10) : NaN;

    //const sessionId = Number((await params).sessionId);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Get session details
    const [session] = await db
      .select()
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.session_id, sessionId),
          eq(practice_sessions.user_id, userId)
        )
      );

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get session questions with details
    const sessionQuestions = await db
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
        topic_name: topics.topic_name,
        subtopic_name: subtopics.subtopic_name
      })
      .from(session_questions)
      .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
      .leftJoin(topics, eq(questions.topic_id, topics.topic_id))
      .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
      .where(eq(session_questions.session_id, sessionId))
      .orderBy(session_questions.question_order);

    // Format response
    const formattedQuestions = sessionQuestions.map((sq) => ({
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
        topic_name: sq.topic_name,
        subtopic_name: sq.subtopic_name
      }
    }));

    return NextResponse.json({
      session,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 });
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
    if (isNaN(sessionId)) {
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

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
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
    if (isNaN(sessionId)) {
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

    return Promise.resolve(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting session:', error);
    return Promise.resolve(NextResponse.json({ error: 'Failed to delete session' }, { status: 500 }));
  }
}
