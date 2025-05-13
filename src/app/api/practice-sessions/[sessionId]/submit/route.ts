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
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
  matching_details: {
    items: Array<{
      left_item_text: string;
      left_item_label: string;
      right_item_text: string;
      right_item_label: string;
    }>;
    left_column_header?: string;
    right_column_header?: string;
  };
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
// type OptionBasedResponse = 
//   | string 
//   | number 
//   | { option: string | number } 
//   | { selectedOption: string | number }
//   | { selectedMatches: string | number };

interface ParsedOptionDetails {
  option_number: string;
  option_text: string;
  is_correct: boolean;
}

// Interface for the raw shape of an option before validation and normalization
interface RawOptionBeforeNormalization {
  option_number: unknown;
  option_text?: unknown;
  is_correct: unknown;
  [key: string]: unknown;
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

function evaluateAnswer(
  questionType: string,
  details: QuestionDetails,
  userAnswer: unknown
): boolean {
  try {
    // Normalize userAnswer to simplify processing
    const normalizedAnswer = normalizeUserAnswer(userAnswer);
    
    // If we couldn't extract a meaningful answer, return false
    if (normalizedAnswer === null) {
      console.warn('Could not normalize user answer:', userAnswer);
      return false;
    }

    // Log for debugging
    console.log(`Evaluating ${questionType}:`, { 
      normalizedAnswer, 
      details: JSON.stringify(details).substring(0, 100) + '...' 
    });

    // Evaluate based on question type
    return evaluateOptionBasedAnswer(questionType, details, normalizedAnswer);
  } catch (error) {
    console.error(`Error evaluating answer for question type ${questionType}:`, error);
    // Add detailed logging to help diagnose the issue
    console.error('Question details:', JSON.stringify(details, null, 2));
    console.error('User answer:', JSON.stringify(userAnswer, null, 2));
    return false;
  }
}

function normalizeUserAnswer(userAnswer: unknown): string | null {
  // Handle different input formats consistently
  if (userAnswer === null || userAnswer === undefined) {
    return null;
  }
  
  // Convert numeric answers to strings
  if (typeof userAnswer === 'number') {
    return userAnswer.toString();
  }
  
  // Extract the normalized answer from various possible formats
  if (typeof userAnswer === 'string') {
    return userAnswer;
  } 
  
  // Handle object-based answers
  if (typeof userAnswer === 'object' && userAnswer !== null) {
    const answerObj = userAnswer as Record<string, unknown>;
    
    // Check for nested option formats
    const optionKeys = ['option', 'selectedOption', 'selectedMatches'];
    for (const key of optionKeys) {
      const optionValue = answerObj[key];
      if (typeof optionValue === 'string' || typeof optionValue === 'number') {
        return optionValue.toString();
      }
    }
  }

  // Could not normalize
  console.warn('Could not normalize user answer:', userAnswer);
  return null;
}

function evaluateOptionBasedAnswer(
  questionType: string, 
  details: QuestionDetails, 
  normalizedAnswer: string
): boolean {
  // Ensure the details have options
  if (!('options' in details) || !Array.isArray(details.options)) {
    console.warn(`No options found for question type: ${questionType}`);
    return false;
  }

  // Find matching option
  return details.options.some(
    (opt: ParsedOptionDetails) => 
      opt.is_correct && opt.option_number.toString() === normalizedAnswer
  );
}

function parseQuestionDetails(details: unknown): QuestionDetails {
  // First, check if the details are already in the correct format
  if (isQuestionDetails(details)) {
    // Normalize options to ensure consistent structure
    return {
      ...details,
      options: details.options.map(opt => ({
        option_number: opt.option_number.toString(),
        option_text: opt.option_text || '',
        is_correct: !!opt.is_correct
      }))
    };
  }

  // If details is a string, try to parse it as JSON
  if (typeof details === 'string') {
    try {
      const parsedDetails = JSON.parse(details);
      
      // Validate the parsed details
      if (isQuestionDetails(parsedDetails)) {
        return {
          ...parsedDetails,
          options: parsedDetails.options.map(opt => ({
            option_number: opt.option_number.toString(),
            option_text: opt.option_text || '',
            is_correct: !!opt.is_correct
          }))
        };
      }
      
      throw new Error('Parsed details do not match expected structure');
    } catch (e) {
      console.error('Failed to parse question details string:', e);
      throw new Error('Invalid JSON format in question details');
    }
  }

  // If we reach here, the details are in an invalid format
  throw new Error('Invalid question details format');
}

// Function to extract correct answer for logging/debugging purposes
function getCorrectAnswerForQuestionType(
  questionType: string, 
  details: QuestionDetails
): string {
  try {
    // All supported question types have options
    if ('options' in details && Array.isArray(details.options)) {
      const correctOption = details.options.find((opt: ParsedOptionDetails) => opt.is_correct);
      return correctOption 
        ? `Option ${correctOption.option_number}: ${correctOption.option_text}` 
        : 'Unknown';
    }
    
    return 'No correct option found';
  } catch (error) {
    console.error('Error extracting correct answer:', error);
    return 'Error extracting correct answer';
  }
}
// Type guard for parsing details with improved type safety
function isQuestionDetails(details: unknown): details is QuestionDetails {
  if (typeof details !== 'object' || details === null) {
    return false;
  }

  // Check for required properties based on known question types
  const typedDetails = details as Partial<QuestionDetails>;

  // Check for options array in the details
  if (!Array.isArray(typedDetails.options)) {
    return false;
  }

  // Validate options structure
  return typedDetails.options.every(opt => {
    if (typeof opt !== 'object' || opt === null) return false;
    
    const typedOpt = opt as RawOptionBeforeNormalization; // Use a specific type for looser check before normalization
    return (
      (typeof typedOpt.option_number === 'string' || typeof typedOpt.option_number === 'number') &&
      (typedOpt.option_text === undefined || typedOpt.option_text === null || typeof typedOpt.option_text === 'string') &&
      (typeof typedOpt.is_correct === 'boolean' || typeof typedOpt.is_correct === 'number') // Numbers 0 or 1 are often used for boolean
    );
  });
}

// function explainOptionBasedResponse(_response: OptionBasedResponse): string {
//   return 'This function exists to provide type documentation for OptionBasedResponse';
// }
