//File: src/app/api/practice-sessions/[sessionId]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry } from '@/db';
import {
  practice_sessions,
  session_questions,
  question_attempts,
  questions,
} from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { 
  evaluateAnswer, 
  parseQuestionDetails, 
  getCorrectAnswerForQuestionType,
  AnswerResult,
  QuestionDetails
} from '@/lib/utils/answerEvaluation';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/services/CacheService';
import { RATE_LIMITS, applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { z } from 'zod';
import { 
  SubmitAnswersBody, 
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
  time_taken_seconds?: number | null;
  attempt_timestamp: Date;
  created_at: Date;
  updated_at: Date;
}

interface OptimizedQuestionData {
  session_question_id: number;
  question_id: number;
  details: QuestionDetails;
  marks: number | null;
  negative_marks: number | null;
  question_type: string;
  topic_id: number | null;
  hasExistingAttempt: boolean;
}

// Validation schema for answer submission
const submitAnswersSchema = z.object({
  answers: z.record(z.string(), z.union([
    z.string(),
    z.record(z.string(), z.string())
  ])),
  timingData: z.object({
    totalSeconds: z.number().optional(),
    questionTimes: z.record(z.string(), z.number()).optional(),
    averageTimePerQuestion: z.number().optional()
  }).optional()
});

/**
 * Submit answers for a practice session - OPTIMIZED VERSION
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

    // Verify session exists and belongs to user - with retry for database connection issues
    const [session] = await withRetry(async () => {
      const result = await db
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
      return result;
    });

    if (!session) {
      logger.warn('Session not found for answer submission', {
        userId,
        context: 'practice-sessions/[sessionId]/submit.POST',
        data: { sessionId }
      });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.is_completed) {
      logger.info('Session already completed, returning existing data', {
        userId,
        context: 'practice-sessions/[sessionId]/submit.POST',
        data: { sessionId }
      });
      
      // Get the existing session stats for completed session - with retry
      const [completedSession] = await withRetry(async () => {
        const result = await db
          .select({
            questions_attempted: practice_sessions.questions_attempted,
            questions_correct: practice_sessions.questions_correct,
            score: practice_sessions.score,
            max_score: practice_sessions.max_score,
            is_completed: practice_sessions.is_completed
          })
          .from(practice_sessions)
          .where(eq(practice_sessions.session_id, sessionIdNum));
        return result;
      });

      return NextResponse.json({
        success: true,
        message: 'Session already completed',
        sessionStats: completedSession || {
          questions_attempted: 0,
          questions_correct: 0,
          score: 0,
          max_score: 0,
          is_completed: true
        },
        results: []
      });
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
    
    const { answers = {}, timingData } = body;

    if (Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'No answers provided' },
        { status: 400 }
      );
    }

    // OPTIMIZATION 1: Single query to get all data needed for processing
    // Get session questions, question details, and existing attempts in one optimized query
    const questionIds = Object.keys(answers).map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (questionIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid question IDs provided' },
        { status: 400 }
      );
    }

    // OPTIMIZATION 2: Use parallel queries instead of sequential ones - with retry
    const [sessionQuestions, existingAttempts] = await Promise.all([
      // Get session questions with question details in one query
      withRetry(async () => 
        db
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
              eq(session_questions.user_id, userId),
              inArray(session_questions.question_id, questionIds)
            )
          )
      ),
      
      // Get existing attempts for these specific questions only
      withRetry(async () =>
        db
          .select({ 
            question_id: question_attempts.question_id 
          })
          .from(question_attempts)
          .where(
            and(
              eq(question_attempts.session_id, sessionIdNum),
              eq(question_attempts.user_id, userId),
              inArray(question_attempts.question_id, questionIds)
            )
          )
      )
    ]);

    // OPTIMIZATION 3: Use Maps for O(1) lookups instead of O(N) find operations
    const existingAttemptIds = new Set(
      existingAttempts.map(a => a.question_id.toString())
    );

    // Create optimized question data map with all needed information
    const questionDataMap = new Map<string, OptimizedQuestionData>();
    
    for (const q of sessionQuestions) {
      try {
        const parsedDetails = parseQuestionDetails(q.details);
        questionDataMap.set(q.question_id.toString(), {
          session_question_id: q.session_question_id,
          question_id: q.question_id,
          details: parsedDetails,
          marks: q.marks,
          negative_marks: q.negative_marks,
          question_type: q.question_type,
          topic_id: q.topic_id,
          hasExistingAttempt: existingAttemptIds.has(q.question_id.toString())
        });
      } catch (error) {
        logger.warn('Failed to parse question details', {
          userId,
          context: 'practice-sessions/[sessionId]/submit.POST',
          data: { questionId: q.question_id },
          error: error instanceof Error ? error.message : String(error)
        });
        // Skip this question if parsing fails
        continue;
      }
    }

    // OPTIMIZATION 4: Process answers efficiently without nested loops
    const results: AnswerResult[] = [];
    const evaluationLog: Record<string, {
      questionType: string;
      userAnswer: unknown;
      correctAnswer: unknown;
      isCorrect: boolean;
    }> = {};
    const topicIdsWithNewAttempts = new Set<number>();
    const attemptsToInsert: QuestionAttemptRecord[] = [];
    const timingUpdates: Array<{
      sessionQuestionId: number;
      timeSpent: number;
    }> = [];

    // Process each answer efficiently
    for (const [questionId, userAnswer] of Object.entries(answers)) {
      const questionData = questionDataMap.get(questionId);
      
      // Skip if question not found or already has attempt
      if (!questionData || questionData.hasExistingAttempt) {
        continue;
      }

      // Evaluate answer
      let isCorrect = false;
      let correctAnswer: unknown = null;
      
      try {
        isCorrect = evaluateAnswer(
          questionData.question_type,
          questionData.details,
          userAnswer
        );
        
        // Only get correct answer for debugging in development
        if (process.env.NODE_ENV === 'development') {
          correctAnswer = getCorrectAnswerForQuestionType(
            questionData.question_type, 
            questionData.details
          );
          
          evaluationLog[questionId] = {
            questionType: questionData.question_type,
            userAnswer,
            correctAnswer,
            isCorrect
          };
        }
        
      } catch (error) {
        logger.error('Error evaluating answer', {
          userId,
          context: 'practice-sessions/[sessionId]/submit.POST',
          data: { 
            sessionId, 
            questionId, 
            questionType: questionData.question_type 
          },
          error: error instanceof Error ? error.message : String(error)
        });
        continue; // Skip this question if there's an error
      }

      // Calculate marks awarded
      const marksAwarded = isCorrect
        ? questionData.marks ?? 0
        : -(questionData.negative_marks ?? 0);

      // Track topic IDs for mastery updates
      if (questionData.topic_id) {
        topicIdsWithNewAttempts.add(questionData.topic_id);
      }

      // Prepare timing update if available
      const timeSpent = timingData?.questionTimes?.[questionId];
      if (typeof timeSpent === 'number' && timeSpent > 0) {
        timingUpdates.push({
          sessionQuestionId: questionData.session_question_id,
          timeSpent
        });
      }

      // Prepare the question attempt record for batch insert
      const questionIdNum = parseInt(questionId);
      
      attemptsToInsert.push({
        user_id: userId,
        question_id: questionIdNum,
        session_id: sessionIdNum,
        session_question_id: questionData.session_question_id,
        attempt_number: 1,
        user_answer: userAnswer, // Store answer directly, Drizzle handles JSON serialization
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        time_taken_seconds: typeof timeSpent === 'number' ? timeSpent : null,
        attempt_timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      results.push({
        question_id: questionIdNum,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
      });
    }

    // OPTIMIZATION 5: Batch all database operations in a single transaction - with retry
    if (attemptsToInsert.length > 0) {
      await withRetry(async () => {
        await db.transaction(async (tx) => {
          // Insert all attempts at once
          await tx.insert(question_attempts).values(attemptsToInsert);
          
          // Update timing data in batch if available
          if (timingUpdates.length > 0) {
            // Use Promise.all for parallel timing updates
            await Promise.all(
              timingUpdates.map(({ sessionQuestionId, timeSpent }) =>
                tx
                  .update(session_questions)
                  .set({
                    time_spent_seconds: timeSpent,
                    updated_at: new Date()
                  })
                  .where(
                    and(
                      eq(session_questions.session_question_id, sessionQuestionId),
                      eq(session_questions.session_id, sessionIdNum),
                      eq(session_questions.user_id, userId)
                    )
                  )
              )
            );
          }
        });
      });
    }

    // Log detailed evaluation results at debug level
    logger.debug('Answer evaluation results', {
      userId,
      context: 'practice-sessions/[sessionId]/submit.POST',
      data: { sessionId, evaluationLog }
    });

    // OPTIMIZATION 6: Prepare topic mastery updates correctly - FIXED CRITICAL BUG
    // The bug was using Array.find() which only gets the first result per topic
    // We need to pass ALL individual question results to updateTopicMasteryBatch
    const topicMasteryUpdates: Array<{ topicId: number, isCorrect: boolean }> = [];
    
    for (const result of results) {
      const questionData = questionDataMap.get(result.question_id.toString());
      if (questionData?.topic_id) {
        topicMasteryUpdates.push({
          topicId: questionData.topic_id,
          isCorrect: result.is_correct
        });
      }
    }

    // After the transaction, update session statistics and topic mastery in parallel
    const { updateSessionStats, updateTopicMasteryBatch } = await import('@/lib/utilities/sessionUtils');
    
    // Run session stats update and topic mastery updates in parallel
    await Promise.all([
      updateSessionStats(sessionIdNum, userId),
      topicMasteryUpdates.length > 0 ? updateTopicMasteryBatch(userId, topicMasteryUpdates) : Promise.resolve()
    ]);

    // OPTIMIZATION: Mark session as completed and get updated stats in single atomic operation
    // Note: Session is marked as completed on any answer submission (intended behavior)
    const sessionUpdateData: {
      is_completed: boolean;
      end_time: Date;
      updated_at: Date;
      duration_minutes?: number;
    } = {
      is_completed: true,
      end_time: new Date(),
      updated_at: new Date()
    };

    // Add duration if timing data is available
    if (timingData?.totalSeconds) {
      sessionUpdateData.duration_minutes = Math.ceil(timingData.totalSeconds / 60);
    }

    const [updatedSession] = await withRetry(async () => {
      const result = await db
        .update(practice_sessions)
        .set(sessionUpdateData)
        .where(eq(practice_sessions.session_id, sessionIdNum))
        .returning({
          questions_attempted: practice_sessions.questions_attempted,
          questions_correct: practice_sessions.questions_correct,
          score: practice_sessions.score,
          max_score: practice_sessions.max_score,
          is_completed: practice_sessions.is_completed
        });
      return result;
    });

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