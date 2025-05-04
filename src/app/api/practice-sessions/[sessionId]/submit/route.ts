//File: src/app/api/practice-sessions/[sessionId]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  practice_sessions,
  session_questions,
  question_attempts,
  questions,
} from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// TypeScript Interfaces for Question Details
interface MultipleChoiceDetails {
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

interface MatchingDetails {
  items: Array<{
    left_item_text: string;
    left_item_label: string;
    right_item_text: string;
    right_item_label: string;
  }>;
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

interface AssertionReasonDetails {
  statements: Array<{
    is_correct: boolean;
    statement_text: string;
    statement_label: string;
  }>;
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

interface SequenceOrderingDetails {
  sequence_items: Array<{
    item_text: string;
    item_number: number;
  }>;
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

interface DiagramBasedDetails {
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

interface MultipleCorrectStatementsDetails {
  statements: Array<{
    is_correct: boolean;
    statement_text: string;
    statement_label: string;
  }>;
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

type QuestionDetails =
  | MultipleChoiceDetails
  | MatchingDetails
  | AssertionReasonDetails
  | SequenceOrderingDetails
  | DiagramBasedDetails
  | MultipleCorrectStatementsDetails;

// Interface for individual result objects
interface AnswerResult {
  question_id: number;
  is_correct: boolean;
  marks_awarded: number;
}

interface SubmitAnswersBody {
  answers: Record<string, string | { [key: string]: string }>; // questionId -> answer (string or object)
}

interface QuestionDetailsWithSessionInfo {
  session_question_id: number;
  details: QuestionDetails;
  marks: number | null;
  negative_marks: number | null;
  question_type: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session ID from params
    const sessionId = parseInt((await params).sessionId);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Verify session exists and belongs to user
    const [session] = await db
      .select({
        session_id: practice_sessions.session_id,
        is_completed: practice_sessions.is_completed,
      })
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

    if (session.is_completed) {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body: SubmitAnswersBody = await request.json();
    const { answers = {} } = body;

    if (Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'No answers provided' },
        { status: 400 }
      );
    }

    // Get all session questions with their details
    const sessionQuestions = await db
      .select({
        session_question_id: session_questions.session_question_id,
        question_id: session_questions.question_id,
        details: questions.details,
        marks: questions.marks,
        negative_marks: questions.negative_marks,
        question_type: questions.question_type,
      })
      .from(session_questions)
      .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
      .where(
        and(
          eq(session_questions.session_id, sessionId),
          eq(session_questions.user_id, userId)
        )
      );

    // Create a map for easier access
    const questionDetailsMap: Record<string, QuestionDetailsWithSessionInfo> = 
      sessionQuestions.reduce((map, q) => {
        map[q.question_id.toString()] = {
          session_question_id: q.session_question_id,
          details: typeof q.details === 'string' 
            ? JSON.parse(q.details) 
            : q.details,
          marks: q.marks,
          negative_marks: q.negative_marks,
          question_type: q.question_type,
        };
        return map;
      }, {} as Record<string, QuestionDetailsWithSessionInfo>);

    // Check existing attempts to avoid duplicates
    const existingAttempts = await db
      .select({ question_id: question_attempts.question_id })
      .from(question_attempts)
      .where(
        and(
          eq(question_attempts.session_id, sessionId),
          eq(question_attempts.user_id, userId)
        )
      );
    
    // Create a set of question IDs that already have attempts
    const existingAttemptIds = new Set(
      existingAttempts.map(a => a.question_id.toString())
    );
    
    const results: AnswerResult[] = [];
    
    // Process each answer and create records for new attempts only
    await db.transaction(async (tx) => {
      for (const questionId of Object.keys(answers)) {
        // Skip if this question already has an attempt
        if (existingAttemptIds.has(questionId)) {
          continue;
        }
        
        const userAnswer = answers[questionId];
        const questionDetails = questionDetailsMap[questionId];

        if (!questionDetails) {
          continue; // Skip this question if it doesn't belong to the session
        }

        // Evaluate if the answer is correct
        const isCorrect = evaluateAnswer(
          questionDetails.question_type,
          questionDetails.details,
          userAnswer
        );

        // Calculate marks awarded
        const marksAwarded = isCorrect
          ? questionDetails.marks ?? 0
          : -(questionDetails.negative_marks ?? 0);

        // Create the question attempt record
        await tx
          .insert(question_attempts)
          .values({
            user_id: userId,
            question_id: parseInt(questionId),
            session_id: sessionId,
            session_question_id: questionDetails.session_question_id,
            attempt_number: 1, // First attempt
            user_answer: JSON.stringify({ option: userAnswer }),
            is_correct: isCorrect,
            marks_awarded: marksAwarded,
            attempt_timestamp: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          });

        results.push({
          question_id: parseInt(questionId),
          is_correct: isCorrect,
          marks_awarded: marksAwarded,
        });
      }
    });

    // After the transaction, update session statistics
    const { updateSessionStats } = await import('@/lib/utilities/sessionUtils');
    await updateSessionStats(sessionId, userId);

    // Get the updated session stats
    const [updatedSession] = await db
      .select({
        questions_attempted: practice_sessions.questions_attempted,
        questions_correct: practice_sessions.questions_correct,
        score: practice_sessions.score,
        max_score: practice_sessions.max_score,
        is_completed: practice_sessions.is_completed
      })
      .from(practice_sessions)
      .where(eq(practice_sessions.session_id, sessionId));

    // Mark the session as completed if not already
    if (!updatedSession.is_completed) {
      await db
        .update(practice_sessions)
        .set({
          is_completed: true,
          end_time: new Date(),
          updated_at: new Date()
        })
        .where(eq(practice_sessions.session_id, sessionId));
    }

    // Return the response with the latest statistics
    return NextResponse.json({
      success: true,
      session_id: sessionId,
      total_answers: Object.keys(answers).length,
      total_correct: updatedSession.questions_correct ?? 0,
      accuracy: (updatedSession.questions_attempted ?? 0) > 0 
        ? Math.round(((updatedSession.questions_correct ?? 0) / (updatedSession.questions_attempted ?? 1)) * 100) // Handle null check and division by zero
        : 0,
      score: updatedSession.score ?? 0,
      max_score: updatedSession.max_score ?? 0,
      results,
    });
  } catch (error) {
    console.error('Error submitting answers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to parse and evaluate question details
function evaluateAnswer(
  questionType: string,
  details: QuestionDetails,
  userAnswer: unknown
): boolean {
  try {
    switch (questionType) {
      case 'MultipleChoice':
        const multipleChoiceDetails = details as MultipleChoiceDetails;
        const stringAnswer = typeof userAnswer === 'string' ? userAnswer : '';
        return multipleChoiceDetails.options.some(
          (opt) => opt.is_correct && opt.option_number === stringAnswer
        );

      case 'Matching':
        const matchingDetails = details as MatchingDetails;
        const matchingAnswer = userAnswer as { [key: string]: string };
        if (!matchingAnswer || typeof matchingAnswer !== 'object') return false;
        
        return matchingDetails.items.every((pair) => {
          const userRightItemLabel = matchingAnswer[pair.left_item_label];
          return userRightItemLabel === pair.right_item_label;
        });

      case 'AssertionReason':
        const assertionReasonDetails = details as AssertionReasonDetails;
        const assertionAnswer = typeof userAnswer === 'string' ? userAnswer : '';
        return assertionReasonDetails.options.some(
          (opt) => opt.is_correct && opt.option_number === assertionAnswer
        );

      case 'SequenceOrdering':
        const sequenceOrderingDetails = details as SequenceOrderingDetails;
        const sequenceAnswer = typeof userAnswer === 'string' ? userAnswer : '';
        return sequenceOrderingDetails.options.some(
          (opt) => opt.is_correct && opt.option_number === sequenceAnswer
        );

      case 'DiagramBased':
        const diagramBasedDetails = details as DiagramBasedDetails;
        const diagramAnswer = typeof userAnswer === 'string' ? userAnswer : '';
        return diagramBasedDetails.options.some(
          (opt) => opt.is_correct && opt.option_number === diagramAnswer
        );

      case 'MultipleCorrectStatements':
        const multipleCorrectStatementsDetails = details as MultipleCorrectStatementsDetails;
        const mcAnswer = typeof userAnswer === 'string' ? userAnswer : '';
        return multipleCorrectStatementsDetails.options.some(
          (opt) => opt.is_correct && opt.option_number === mcAnswer
        );

      default:
        console.warn(`Unsupported question type: ${questionType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error evaluating answer for question type ${questionType}:`, error);
    return false;
  }
}
