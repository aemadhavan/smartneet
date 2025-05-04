// Create a utility function in a shared location (e.g., src/lib/utilities/sessionUtils.ts)

import { db } from '@/db';
import { practice_sessions, session_questions, question_attempts, questions } from '@/db/schema'; // Added 'questions'
import { and, eq, count, countDistinct, sum } from 'drizzle-orm'; // Added countDistinct, sum

/**
 * Atomically updates the practice session statistics based on question attempts
 * 
 * @param sessionId The ID of the session to update
 * @param userId The user ID associated with the session
 * @returns Object containing the updated session stats
 */
export async function updateSessionStats(
  sessionId: number,
  userId: string
): Promise<{
  questions_attempted: number,
  questions_correct: number,
  score: number,
  max_score: number
}> {
  // Use a transaction to ensure atomicity
  return await db.transaction(async (tx) => {
    // First, verify the session exists and belongs to the user
    const [session] = await tx
      .select({
        session_id: practice_sessions.session_id,
        total_questions: practice_sessions.total_questions
      })
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.session_id, sessionId),
          eq(practice_sessions.user_id, userId)
        )
      );
    
    if (!session) {
      throw new Error('Session not found or does not belong to the user');
    }

    // Get the actual count of question attempts for this session
    const [attemptsResult] = await tx
      .select({
        count: count()
      })
      .from(question_attempts)
      .where(
        and(
          eq(question_attempts.session_id, sessionId),
          eq(question_attempts.user_id, userId)
        )
      );

    // Calculate the total number of questions that have been attempted
    // This gets all unique questions that have attempts
    const [uniqueAttemptsResult] = await tx
      .select({
        distinctCount: countDistinct(question_attempts.question_id) // Use countDistinct
      })
      .from(question_attempts)
      .where(
        and(
          eq(question_attempts.session_id, sessionId),
          eq(question_attempts.user_id, userId)
        )
      );

    // Get the number of correct questions (count distinct question_ids where is_correct=true)
    const [correctResult] = await tx
      .select({
        distinctCorrect: countDistinct(question_attempts.question_id) // Use countDistinct
      })
      .from(question_attempts)
      .where(
        and(
          eq(question_attempts.session_id, sessionId),
          eq(question_attempts.user_id, userId),
          eq(question_attempts.is_correct, true)
        )
      );

    // Calculate total score from marks_awarded in attempts
    const scoreResults = await tx
      .select({
        question_id: question_attempts.question_id,
        marks_awarded: question_attempts.marks_awarded
      })
      .from(question_attempts)
      .where(
        and(
          eq(question_attempts.session_id, sessionId),
          eq(question_attempts.user_id, userId)
        )
      )
      .orderBy(question_attempts.attempt_timestamp);
    
    // Use a Map to track the latest attempt for each question
    const latestAttemptMap = new Map();
    for (const result of scoreResults) {
      latestAttemptMap.set(result.question_id, result.marks_awarded);
    }
    
    // Sum up the marks from the latest attempt for each question
    const score = Array.from(latestAttemptMap.values()).reduce(
      (sum, marks) => sum + Number(marks || 0), // Explicitly convert marks to number
      0
    );

    // Calculate max possible score from the session questions
    const [maxScoreResult] = await tx
      .select({
        totalMarks: sum(questions.marks) // Use sum directly
      })
      .from(session_questions)
      .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
      .where(eq(session_questions.session_id, sessionId));

    // Calculate final values with validation
    const questions_attempted = Math.min(
      uniqueAttemptsResult?.distinctCount || 0,
      session.total_questions || 0 // Provide default value if null/undefined
    );
    
    const questions_correct = correctResult?.distinctCorrect || 0;
    
    // Ensure max_score is treated as a number. Parse the string result from sum().
    const max_score_str = maxScoreResult?.totalMarks; // Type: string | null | undefined
    const max_score = max_score_str ? parseInt(max_score_str, 10) : 0; 

    // Update the session with accurate statistics
    await tx
      .update(practice_sessions)
      .set({
        questions_attempted,
        questions_correct,
        score,
        max_score,
        updated_at: new Date()
      })
      .where(eq(practice_sessions.session_id, sessionId));

    // Return the updated stats
    return {
      questions_attempted,
      questions_correct,
      score,
      max_score
    };
  });
}

/**
 * Records a question attempt and updates session statistics
 * 
 * @param userId User ID
 * @param sessionId Session ID
 * @param questionId Question ID 
 * @param sessionQuestionId Session Question ID
 * @param userAnswer The user's answer
 * @param isCorrect Whether the answer is correct
 * @param marksAwarded Marks awarded for the answer
 * @param timeTakenSeconds Time taken to answer (optional)
 * @returns The created attempt record
 */
export async function recordQuestionAttempt(
  userId: string,
  sessionId: number,
  questionId: number,
  sessionQuestionId: number,
  userAnswer: unknown,
  isCorrect: boolean,
  marksAwarded: number,
  timeTakenSeconds?: number,
  userNotes?: string
) {
  return await db.transaction(async (tx) => {
    // Create the question attempt record
    const [newAttempt] = await tx
      .insert(question_attempts)
      .values({
        user_id: userId,
        question_id: questionId,
        session_id: sessionId,
        session_question_id: sessionQuestionId,
        attempt_number: 1, // This should be calculated based on existing attempts
        user_answer: userAnswer,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        time_taken_seconds: timeTakenSeconds,
        user_notes: userNotes,
        attempt_timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // Update the time spent on the question if provided
    if (timeTakenSeconds) {
      await tx
        .update(session_questions)
        .set({ time_spent_seconds: timeTakenSeconds })
        .where(eq(session_questions.session_question_id, sessionQuestionId));
    }

    // Update session statistics immediately
    const sessionStats = await updateSessionStats(sessionId, userId);

    return { attempt: newAttempt, sessionStats };
  });
}
