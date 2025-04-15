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
import { auth } from '@clerk/nextjs/server'; // Import from server module
import { z } from 'zod'; // You'll need to install zod package

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
        is_bookmarked: false
      })
    ));

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
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching practice sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch practice sessions' }, { status: 500 });
  }
}

// Helper function to get personalized questions
async function getPersonalizedQuestions(
  userId: string, 
  subjectId: number, 
  topicId?: number, 
  subtopicId?: number, 
  questionCount: number = 20
) {
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
  const potentialQuestions = await baseQuery.where(and(...conditions));
  
  // In a real implementation, we would apply more sophisticated logic:
  // 1. Check user's question_attempts to identify weak areas
  // 2. Balance questions across difficulty levels
  // 3. Prioritize topics with lower mastery_level
  // 4. Include some previously incorrect questions for reinforcement
  
  // For now, we'll just randomize the order and take the requested count
  const shuffled = [...potentialQuestions].sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffled.slice(0, questionCount);
  
  return selectedQuestions;
}
