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

    // Process each answer
    const results = [];
    let totalCorrect = 0;
    let totalScore = 0;
    let maxScore = 0;

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

    // Function to parse and validate question details
    function parseQuestionDetails(
      questionType: string,
      details: QuestionDetails
    ): QuestionDetails | null {
      try {
        switch (questionType) {
          case 'MultipleChoice':
            const multipleChoiceDetails = details as MultipleChoiceDetails;
            if (
              Array.isArray(multipleChoiceDetails.options) &&
              multipleChoiceDetails.options.every(
                (opt) =>
                  typeof opt.is_correct === 'boolean' &&
                  typeof opt.option_text === 'string' &&
                  typeof opt.option_number === 'string'
              )
            ) {
              return multipleChoiceDetails;
            }
            break;

          case 'Matching':
            const matchingDetails = details as MatchingDetails;
            if (
              Array.isArray(matchingDetails.items) &&
              Array.isArray(matchingDetails.options)
            ) {
              return matchingDetails;
            }
            break;

          case 'AssertionReason':
            const assertionReasonDetails = details as AssertionReasonDetails;
            if (
              Array.isArray(assertionReasonDetails.statements) &&
              Array.isArray(assertionReasonDetails.options)
            ) {
              return assertionReasonDetails;
            }
            break;

          case 'SequenceOrdering':
            const sequenceOrderingDetails = details as SequenceOrderingDetails;
            if (
              Array.isArray(sequenceOrderingDetails.sequence_items) &&
              Array.isArray(sequenceOrderingDetails.options)
            ) {
              return sequenceOrderingDetails;
            }
            break;

          case 'DiagramBased':
            const diagramBasedDetails = details as DiagramBasedDetails;
            if (
              Array.isArray(diagramBasedDetails.options) &&
              diagramBasedDetails.options.every(
                (opt) =>
                  typeof opt.is_correct === 'boolean' &&
                  typeof opt.option_text === 'string' &&
                  typeof opt.option_number === 'string'
              )
            ) {
              return diagramBasedDetails;
            }
            break;

          case 'MultipleCorrectStatements':
            const multipleCorrectStatementsDetails = details as MultipleCorrectStatementsDetails;
            if (
              Array.isArray(multipleCorrectStatementsDetails.statements) &&
              Array.isArray(multipleCorrectStatementsDetails.options)
            ) {
              return multipleCorrectStatementsDetails;
            }
            break;

          default:
            console.error(`Unsupported question type: ${questionType}`);
            break;
        }
      } catch (error) {
        console.error(`Error parsing details for question type ${questionType}:`, error);
      }

      return null; // Return null if parsing fails
    }

    // Process each answer
    for (const questionId of Object.keys(answers)) {
      const userAnswer = answers[questionId]; // Access using string key
      const questionDetails = questionDetailsMap[questionId]; // Access using string key

      if (!questionDetails) {
        continue; // Skip this question if it doesn't belong to the session
      }

      let isCorrect = false;
      let marksAwarded = 0;

      try {
        const parsedDetails = parseQuestionDetails(
          questionDetails.question_type,
          questionDetails.details
        );

        if (!parsedDetails) {
          console.error(
            `Invalid details for question type: ${questionDetails.question_type}`
          );
          isCorrect = false;
          marksAwarded = 0;
        } else {
          switch (questionDetails.question_type) {
            case 'MultipleChoice':
              const correctOption = (parsedDetails as MultipleChoiceDetails).options.find(
                (opt) => opt.is_correct && opt.option_number === userAnswer
              );
              isCorrect = !!correctOption;
              break;

            case 'Matching':
              const matchingPairs = (parsedDetails as MatchingDetails).items;
              isCorrect = matchingPairs.every((pair) => {
                const userRightItemLabel = (userAnswer as { [key: string]: string })[pair.left_item_label];
                return userRightItemLabel === pair.right_item_label;
              });
              break;

            case 'AssertionReason':
              const assertionReason = parsedDetails as AssertionReasonDetails;
              isCorrect =
                assertionReason.options.some(
                  (opt) => opt.is_correct && opt.option_number === userAnswer
                );
              break;

            case 'SequenceOrdering':
              const sequenceOrdering = parsedDetails as SequenceOrderingDetails;
              isCorrect =
                sequenceOrdering.options.some(
                  (opt) => opt.is_correct && opt.option_number === userAnswer
                );
              break;

            case 'DiagramBased':
              const diagramBased = parsedDetails as DiagramBasedDetails;
              isCorrect =
                diagramBased.options.some(
                  (opt) => opt.is_correct && opt.option_number === userAnswer
                );
              break;

            case 'MultipleCorrectStatements':
              const multipleCorrectStatements = parsedDetails as MultipleCorrectStatementsDetails;
              isCorrect =
                multipleCorrectStatements.options.some(
                  (opt) => opt.is_correct && opt.option_number === userAnswer
                );
              break;

            default:
              console.error(
                `Unsupported question type: ${questionDetails.question_type}`
              );
              isCorrect = false;
              marksAwarded = 0;
          }
        }

        // Calculate marks
        marksAwarded = isCorrect
          ? questionDetails.marks ?? 0
          : -(questionDetails.negative_marks ?? 0);

        // Add to total score
        if (isCorrect) {
          totalCorrect++;
          totalScore += questionDetails.marks ?? 0;
        } else {
          totalScore -= questionDetails.negative_marks ?? 0;
        }
        maxScore += questionDetails.marks ?? 0;
      } catch (error) {
        console.error(`Error processing question ${questionId}:`, error);
        isCorrect = false;
        marksAwarded = 0;
      }

      // Create the question attempt record
      await db
        .insert(question_attempts)
        .values({
          user_id: userId,
          question_id: parseInt(questionId), // Convert back to number for DB
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
        question_id: parseInt(questionId), // Convert back to number for consistency
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
      });
    }

    // Update session with partial results
    await db
      .update(practice_sessions)
      .set({
        questions_attempted: Object.keys(answers).length,
        questions_correct: totalCorrect,
        score: totalScore,
        max_score: maxScore,
        updated_at: new Date(),
      })
      .where(eq(practice_sessions.session_id, sessionId));

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      total_answers: Object.keys(answers).length,
      total_correct: totalCorrect,
      accuracy: Math.round((totalCorrect / Object.keys(answers).length) * 100),
      score: totalScore,
      max_score: maxScore,
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
