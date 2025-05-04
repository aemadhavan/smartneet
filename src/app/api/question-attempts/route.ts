// src/app/api/question-attempts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  question_attempts, 
  questions, 
  session_questions 
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

    // Try to get data from request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      // If JSON parsing fails, try to get from URL parameters
      console.log('Error parsing JSON in question-attempts, trying URL parameters...',error);
      const searchParams = request.nextUrl.searchParams;
      
      // Extract parameters from URL
      const session_id = searchParams.has('session_id') ? 
        parseInt(searchParams.get('session_id') || '0') : undefined;
      
      const session_question_id = searchParams.has('session_question_id') ? 
        parseInt(searchParams.get('session_question_id') || '0') : undefined;
      
      const question_id = searchParams.has('question_id') ? 
        parseInt(searchParams.get('question_id') || '0') : undefined;
      
      // Parse user_answer from URL parameter if present
      let user_answer;
      try {
        user_answer = searchParams.has('user_answer') ? 
          JSON.parse(searchParams.get('user_answer') || '{}') : undefined;
      } catch (parseError) {
        console.error('Error parsing user_answer JSON:', parseError);
        return NextResponse.json({ 
          error: 'Invalid JSON format for user_answer parameter' 
        }, { status: 400 });
      }
      
      const time_taken_seconds = searchParams.has('time_taken_seconds') ? 
        parseInt(searchParams.get('time_taken_seconds') || '0') : undefined;
      
      const user_notes = searchParams.get('user_notes') || undefined;

      // Check if we have the required fields
      if (!session_id || !session_question_id || !question_id || !user_answer) {
        return NextResponse.json({ 
          error: 'Missing required parameters: session_id, session_question_id, question_id, and user_answer are required' 
        }, { status: 400 });
      }
      
      requestData = {
        session_id,
        session_question_id,
        question_id,
        user_answer,
        time_taken_seconds,
        user_notes
      };
      
      console.log('Using URL parameters for question attempt:', requestData);
    }

    // Validate the data using the schema
    try {
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
      const { recordQuestionAttempt, updateTopicMastery } = await import('@/lib/utilities/sessionUtils');

      // Use the standardized approach to record the attempt and update session
      const result = await recordQuestionAttempt(
        userId,
        validatedData.session_id,
        validatedData.question_id,
        validatedData.session_question_id,
        validatedData.user_answer,
        isCorrect,
        marksAwarded,
        validatedData.time_taken_seconds
      );

      // Update topic mastery
      await updateTopicMastery(userId, questionDetails.topic_id, isCorrect);

      return NextResponse.json({
        attempt_id: result.attempt.attempt_id,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        session_stats: result.sessionStats
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { 
          error: validationError instanceof z.ZodError ? 
            validationError.errors : 
            'Invalid attempt parameters',
          details: validationError instanceof z.ZodError ? 
            validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') : 
            'Unknown validation error'
        }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error recording question attempt:', error);
    return NextResponse.json(
      { error: 'Failed to record question attempt. Please try again.' },
      { status: 500 }
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