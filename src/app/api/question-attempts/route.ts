// src/app/api/question-attempts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  question_attempts, 
  questions, 
  session_questions,
  practice_sessions,
  topic_mastery 
} from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

type MultipleChoiceDetails = {
  correctOption: string;
};

type MultipleCorrectStatementsDetails = {
  correctOptions: string[];
};

type MultipleChoiceAnswer = {
  selectedOption: string;
};

type MultipleCorrectStatementsAnswer = {
  selectedOptions: string[];
};

// Schema for validating attempt submission
const attemptSchema = z.object({
  session_id: z.number(),
  session_question_id: z.number(),
  question_id: z.number(),
  user_answer: z.any(), // Using any for flexible JSONB data
  time_taken_seconds: z.number().optional(),
  user_notes: z.string().optional()
});

// Record a question attempt
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    const validatedData = attemptSchema.parse(requestData);

    // Get question details to evaluate the answer
    const [questionDetails] = await db
      .select({
        question_id: questions.question_id,
        question_type: questions.question_type,
        details: questions.details,
        marks: questions.marks,
        negative_marks: questions.negative_marks,
        topic_id: questions.topic_id
      })
      .from(questions)
      .where(eq(questions.question_id, validatedData.question_id));

    if (!questionDetails) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Evaluate if the answer is correct (implementation depends on question type)
    const isCorrect = evaluateAnswer(questionDetails.question_type, questionDetails.details, validatedData.user_answer);
    
    // Calculate marks awarded
    const marksAwarded = isCorrect ? (questionDetails.marks ?? 4) : -(questionDetails.negative_marks ?? 1);

    // Check if the session question exists
    const [sessionQuestion] = await db
      .select()
      .from(session_questions)
      .where(
        and(
          eq(session_questions.session_question_id, validatedData.session_question_id),
          eq(session_questions.session_id, validatedData.session_id)
        )
      );

    if (!sessionQuestion) {
      return NextResponse.json({ error: 'Session question not found' }, { status: 404 });
    }

    // Create the attempt record
    const [newAttempt] = await db.insert(question_attempts).values({
      user_id: userId,
      question_id: validatedData.question_id,
      session_id: validatedData.session_id,
      session_question_id: validatedData.session_question_id,
      user_answer: validatedData.user_answer,
      is_correct: isCorrect,
      time_taken_seconds: validatedData.time_taken_seconds,
      marks_awarded: marksAwarded,
      user_notes: validatedData.user_notes,
      attempt_timestamp: new Date()
    }).returning();

    // Update session statistics
    await updateSessionStats(validatedData.session_id, isCorrect, marksAwarded);

    // Update topic mastery
    await updateTopicMastery(userId, questionDetails.topic_id, isCorrect);

    // Update session question time spent
    if (validatedData.time_taken_seconds) {
      await db.update(session_questions)
        .set({ 
          time_spent_seconds: validatedData.time_taken_seconds 
        })
        .where(eq(session_questions.session_question_id, validatedData.session_question_id));
    }

    return NextResponse.json({
      attempt_id: newAttempt.attempt_id,
      is_correct: isCorrect,
      marks_awarded: marksAwarded
    });
  } catch (error) {
    console.error('Error recording question attempt:', error);
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.errors : 'Failed to record question attempt' },
      { status: 400 }
    );
  }
}

// Get attempts history for a user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get('questionId') ? parseInt(searchParams.get('questionId')!) : undefined;
    const sessionId = searchParams.get('sessionId') ? parseInt(searchParams.get('sessionId')!) : undefined;
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query conditions
    const conditions = [eq(question_attempts.user_id, userId)];
    
    if (questionId) {
      conditions.push(eq(question_attempts.question_id, questionId));
    }
    
    if (sessionId) {
      conditions.push(eq(question_attempts.session_id, sessionId));
    }

    // Query attempts
    const attempts = await db
      .select()
      .from(question_attempts)
      .where(and(...conditions))
      .orderBy(sql`${question_attempts.attempt_timestamp} DESC`)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(attempts);
  } catch (error) {
    console.error('Error fetching question attempts:', error);
    return NextResponse.json({ error: 'Failed to fetch question attempts' }, { status: 500 });
  }
}

// Helper function to evaluate answers based on question type
function evaluateAnswer(
  questionType: string,
  questionDetails: unknown,
  userAnswer: unknown
): boolean {
  switch (questionType) {
    case 'MultipleChoice': {
      const details = questionDetails as MultipleChoiceDetails;
      const answer = userAnswer as MultipleChoiceAnswer;
      return answer.selectedOption === details.correctOption;
    }
    case 'MultipleCorrectStatements': {
      const details = questionDetails as MultipleCorrectStatementsDetails;
      const answer = userAnswer as MultipleCorrectStatementsAnswer;
      const correctAnswers = new Set(details.correctOptions);
      const userAnswers = new Set(answer.selectedOptions);

      if (correctAnswers.size !== userAnswers.size) return false;

      for (const ans of userAnswers) {
        if (!correctAnswers.has(ans)) return false;
      }

      return true;
    }
    default:
      console.warn(`Evaluation for question type ${questionType} not fully implemented`);
      return false;
  }
}

// Helper function to update session statistics
async function updateSessionStats(
  sessionId: number, 
  isCorrect: boolean, 
  marksAwarded: number
): Promise<void> {
  await db.transaction(async (tx) => {
    // Get current session stats
    const [session] = await tx
      .select({
        questions_attempted: practice_sessions.questions_attempted,
        questions_correct: practice_sessions.questions_correct,
        score: practice_sessions.score
      })
      .from(practice_sessions)
      .where(eq(practice_sessions.session_id, sessionId));
    
    if (!session) return;
    
    // Update session stats
    await tx
      .update(practice_sessions)
      .set({
        questions_attempted: (session.questions_attempted || 0) + 1,
        questions_correct: isCorrect ? (session.questions_correct || 0) + 1 : (session.questions_correct || 0),
        score: (session.score || 0) + marksAwarded,
        updated_at: new Date()
      })
      .where(eq(practice_sessions.session_id, sessionId));
  });
}

// Helper function to update topic mastery
async function updateTopicMastery(
  userId: string, 
  topicId: number, 
  isCorrect: boolean
): Promise<void> {
  await db.transaction(async (tx) => {
    // Get current mastery level
    const [mastery] = await tx
      .select()
      .from(topic_mastery)
      .where(
        and(
          eq(topic_mastery.user_id, userId),
          eq(topic_mastery.topic_id, topicId)
        )
      );
    
    if (mastery) {
      // Update existing mastery record
      const questionsAttempted = mastery.questions_attempted + 1;
      const questionsCorrect = isCorrect ? mastery.questions_correct + 1 : mastery.questions_correct;
      const accuracyPercentage = Math.round((questionsCorrect / questionsAttempted) * 100);
      
      // Determine new mastery level
      let masteryLevel = mastery.mastery_level;
      
      // Simple mastery algorithm (customize as needed)
      if (questionsAttempted >= 20) {
        if (accuracyPercentage >= 90) masteryLevel = 'mastered';
        else if (accuracyPercentage >= 75) masteryLevel = 'advanced';
        else if (accuracyPercentage >= 60) masteryLevel = 'intermediate';
        else masteryLevel = 'beginner';
      } else if (questionsAttempted >= 10) {
        if (accuracyPercentage >= 80) masteryLevel = 'advanced';
        else if (accuracyPercentage >= 60) masteryLevel = 'intermediate';
        else masteryLevel = 'beginner';
      } else if (questionsAttempted >= 5) {
        if (accuracyPercentage >= 70) masteryLevel = 'intermediate';
        else masteryLevel = 'beginner';
      } else {
        masteryLevel = 'beginner';
      }
      
      await tx
        .update(topic_mastery)
        .set({
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          accuracy_percentage: accuracyPercentage,
          mastery_level: masteryLevel,
          last_practiced: new Date(),
          updated_at: new Date()
        })
        .where(
          and(
            eq(topic_mastery.user_id, userId),
            eq(topic_mastery.topic_id, topicId)
          )
        );
    } else {
      // Create new mastery record
      await tx
        .insert(topic_mastery)
        .values({
          user_id: userId,
          topic_id: topicId,
          mastery_level: 'beginner',
          questions_attempted: 1,
          questions_correct: isCorrect ? 1 : 0,
          accuracy_percentage: isCorrect ? 100 : 0,
          last_practiced: new Date()
        });
    }
  });
}
