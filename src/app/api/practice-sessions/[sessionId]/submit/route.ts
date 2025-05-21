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
import { 
  evaluateAnswer, 
  parseQuestionDetails, 
  getCorrectAnswerForQuestionType,
  QuestionDetails 
} from '@/lib/utils/answerEvaluation';

// Interface for individual result objects (if still needed locally, otherwise remove)
interface AnswerResult {
  question_id: number;
  is_correct: boolean;
  marks_awarded: number;
}

interface SubmitAnswersBody {
  answers: Record<string, string | { [key: string]: string }>; // questionId -> answer (string or object)
}

// This interface combines QuestionDetails (imported) with session-specific info.
interface QuestionDetailsWithSessionInfo {
  session_question_id: number;
  details: QuestionDetails; // This now uses the imported QuestionDetails type
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
        const parsedDetails = parseQuestionDetails(q.details);
        map[q.question_id.toString()] = {
          session_question_id: q.session_question_id,
          details: parsedDetails,
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
    const evaluationLog: Record<string, unknown> = {};
    
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

        // For debugging purposes
        const correctAnswer = getCorrectAnswerForQuestionType(
          questionDetails.question_type, 
          questionDetails.details
        );
        
        // Evaluate if the answer is correct using our improved function
        let isCorrect = false;
        try {
          isCorrect = evaluateAnswer(
            questionDetails.question_type,
            questionDetails.details,
            userAnswer
          );
          
          // Store evaluation details for debugging
          evaluationLog[questionId] = {
            questionType: questionDetails.question_type,
            userAnswer,
            correctAnswer,
            isCorrect
          };
          
        } catch (error) {
          console.error('Error evaluating answer:', error);
          continue; // Skip this question if there's an error
        }

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

    // Add detailed evaluation log to the server logs
    console.log('Answer evaluation results:', JSON.stringify(evaluationLog, null, 2));

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
      evaluation_summary: evaluationLog // Include this for debugging during development
    });
  } catch (error) {
    console.error('Error submitting answers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// All helper functions (evaluateAnswer, normalizeUserAnswer, evaluateOptionBasedAnswer, 
// parseQuestionDetails, getCorrectAnswerForQuestionType, isQuestionDetails)
// and their related type definitions (MultipleChoiceDetails, MatchingDetails, etc., QuestionDetails union,
// ParsedOptionDetails, RawOptionBeforeNormalization) have been moved to 
// src/lib/utils/answerEvaluation.ts
// They are now imported at the top of this file.
