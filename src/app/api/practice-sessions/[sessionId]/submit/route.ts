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
  AnswerResult
} from '@/lib/utils/answerEvaluation';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/services/CacheService';
import { RATE_LIMITS, applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { z } from 'zod';
import { 
  SubmitAnswersBody, 
  QuestionDetailsWithSessionInfo,
  SubmitAnswersResponse
} from '@/types/answer-submission';

interface QuestionAttemptRecord {
  user_id: string;
  question_id: number;
  session_id: number;
  session_question_id: number;
  attempt_number: number;
  user_answer: unknown;
  is_correct: boolean;
  marks_awarded: number;
  attempt_timestamp: Date;
  created_at: Date;
  updated_at: Date;
}

// Validation schema for answer submission
const submitAnswersSchema = z.object({
  answers: z.record(z.string(), z.union([
    z.string(),
    z.record(z.string(), z.string())
  ]))
});

/**
 * Submit answers for a practice session
 */
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
    const sessionId = (await params).sessionId;
    const sessionIdNum = parseInt(sessionId);
    if (isNaN(sessionIdNum)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(
      userId, 
      `submit-session-answers:${sessionId}`, 
      RATE_LIMITS.SUBMIT_SESSION_ANSWERS
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
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
          eq(practice_sessions.session_id, sessionIdNum),
          eq(practice_sessions.user_id, userId)
        )
      );

    if (!session) {
      logger.warn('Session not found for answer submission', {
        userId,
        context: 'practice-sessions/[sessionId]/submit.POST',
        data: { sessionId }
      });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.is_completed) {
      logger.warn('Attempted to submit answers to already completed session', {
        userId,
        context: 'practice-sessions/[sessionId]/submit.POST',
        data: { sessionId }
      });
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Parse and validate the request body
    let body: SubmitAnswersBody;
    try {
      body = await request.json();
      submitAnswersSchema.parse(body);
    } catch (e) {
      logger.error('Invalid answer submission format', {
        userId,
        context: 'practice-sessions/[sessionId]/submit.POST',
        error: e instanceof Error ? e.message : String(e)
      });
      
      if (e instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Invalid answer submission format',
            details: e.errors
          }, 
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
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
        topic_id: questions.topic_id
      })
      .from(session_questions)
      .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
      .where(
        and(
          eq(session_questions.session_id, sessionIdNum),
          eq(session_questions.user_id, userId)
        )
      );

    // Create a map for easier access
    const questionDetailsMap: Record<string, QuestionDetailsWithSessionInfo> = 
      sessionQuestions.reduce((map, q) => {
        const parsedDetails = parseQuestionDetails(q.details);
        if (!parsedDetails) {
          logger.warn('Failed to parse question details', {
            userId,
            context: 'practice-sessions/[sessionId]/submit.POST',
            data: { questionId: q.question_id }
          });
          return map;
        }
        map[q.question_id.toString()] = {
          session_question_id: q.session_question_id,
          details: parsedDetails,
          marks: q.marks,
          negative_marks: q.negative_marks,
          question_type: q.question_type,
          topic_id: q.topic_id
        };
        return map;
      }, {} as Record<string, QuestionDetailsWithSessionInfo>);

    // Check existing attempts to avoid duplicates
    const existingAttempts = await db
      .select({ question_id: question_attempts.question_id })
      .from(question_attempts)
      .where(
        and(
          eq(question_attempts.session_id, sessionIdNum),
          eq(question_attempts.user_id, userId)
        )
      );
    
    // Create a set of question IDs that already have attempts
    const existingAttemptIds = new Set(
      existingAttempts.map(a => a.question_id.toString())
    );
    
    const results: AnswerResult[] = [];
    const evaluationLog: Record<string, {
      questionType: string;
      userAnswer: unknown;
      correctAnswer: unknown;
      isCorrect: boolean;
    }> = {};
    const topicIdsWithNewAttempts = new Set<number>();
    
    // Collect all new attempts to insert in a batch
    const attemptsToInsert: QuestionAttemptRecord[] = [];
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

      // For debugging and logging
      const correctAnswer = getCorrectAnswerForQuestionType(
        questionDetails.question_type, 
        questionDetails.details
      );
      
      // Evaluate if the answer is correct
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
        logger.error('Error evaluating answer', {
          userId,
          context: 'practice-sessions/[sessionId]/submit.POST',
          data: { 
            sessionId, 
            questionId, 
            questionType: questionDetails.question_type 
          },
          error: error instanceof Error ? error.message : String(error)
        });
        continue; // Skip this question if there's an error
      }

      // Calculate marks awarded
      const marksAwarded = isCorrect
        ? questionDetails.marks ?? 0
        : -(questionDetails.negative_marks ?? 0);

      // Track topic IDs for mastery updates if topic_id exists
      if (questionDetails.topic_id) {
        topicIdsWithNewAttempts.add(questionDetails.topic_id);
      }

      // Prepare the question attempt record for batch insert
      attemptsToInsert.push({
        user_id: userId,
        question_id: parseInt(questionId),
        session_id: sessionIdNum,
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

    // Perform the batch insert in a transaction
    if (attemptsToInsert.length > 0) {
      await db.transaction(async (tx) => {
        await tx.insert(question_attempts).values(attemptsToInsert);
      });
    }

    // Log detailed evaluation results at debug level
    logger.debug('Answer evaluation results', {
      userId,
      context: 'practice-sessions/[sessionId]/submit.POST',
      data: { sessionId, evaluationLog }
    });

    // After the transaction, update session statistics
    const { updateSessionStats, updateTopicMastery } = await import('@/lib/utilities/sessionUtils');
    
    // Update session stats
    await updateSessionStats(sessionIdNum, userId);
    
    // Update topic mastery for each attempted topic
    for (const topicId of topicIdsWithNewAttempts) {
      const attemptResult = results.find(r => {
        const qId = r.question_id.toString();
        return questionDetailsMap[qId]?.topic_id === topicId;
      });
      if (attemptResult) {
        // Use only the first attempt for this topic
        await updateTopicMastery(userId, topicId, attemptResult.is_correct);
      }
    }

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
      .where(eq(practice_sessions.session_id, sessionIdNum));

    // Mark the session as completed if all questions have been answered
    if (!updatedSession.is_completed) {
      await db
        .update(practice_sessions)
        .set({
          is_completed: true,
          end_time: new Date(),
          updated_at: new Date()
        })
        .where(eq(practice_sessions.session_id, sessionIdNum));
    }

    // Invalidate session caches
    await cacheService.invalidateUserSessionCaches(userId, sessionIdNum);

    // Return the response with the latest statistics
    const responseData: SubmitAnswersResponse = {
      success: true,
      session_id: sessionIdNum,
      total_answers: Object.keys(answers).length,
      total_correct: updatedSession.questions_correct ?? 0,
      accuracy: (updatedSession.questions_attempted ?? 0) > 0 
        ? Math.round(((updatedSession.questions_correct ?? 0) / (updatedSession.questions_attempted ?? 1)) * 100)
        : 0,
      score: updatedSession.score ?? 0,
      max_score: updatedSession.max_score ?? 0,
      results
    };
    
    // Include evaluation summary in development environments only
    if (process.env.NODE_ENV === 'development') {
      responseData.evaluation_summary = evaluationLog;
    }

    logger.info('Answer submission processed successfully', {
      context: 'practice-sessions/[sessionId]/submit.POST',
      data: { 
        sessionId: sessionIdNum,
        totalAnswers: Object.keys(answers).length,
        totalCorrect: updatedSession.questions_correct ?? 0
      }
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error processing answer submission', {
      context: 'practice-sessions/[sessionId]/submit.POST',
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}