// src/lib/utilities/sessionUtils.ts
import { db } from '@/db';
import { practice_sessions, session_questions, question_attempts, questions, topic_mastery, topics } from '@/db/schema'; // Added topics
import { and, eq, countDistinct, sum } from 'drizzle-orm';
import { cache } from '@/lib/cache'; // Import cache
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

/**
 * Updates the topic mastery level for a user based on their question attempts
 * 
 * @param userId User ID
 * @param topicId Topic ID
 * @param isCorrect Whether the latest attempt was correct
 * @returns Object containing updated mastery information
 */
export async function updateTopicMastery(
  userId: string, 
  topicId: number, 
  isCorrect: boolean
): Promise<{
  mastery_level: string,
  questions_attempted: number,
  questions_correct: number,
  accuracy_percentage: number
}> {
  const result = await db.transaction(async (tx) => {
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
    
    let updatedMasteryInfo;

    if (mastery) {
      // Update existing mastery record
      const questionsAttempted = mastery.questions_attempted + 1;
      const questionsCorrect = isCorrect ? mastery.questions_correct + 1 : mastery.questions_correct;
      const accuracyPercentage = Math.round((questionsCorrect / questionsAttempted) * 100);
      
      let masteryLevel = mastery.mastery_level;
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
      
      updatedMasteryInfo = {
        mastery_level: masteryLevel,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        accuracy_percentage: accuracyPercentage
      };
    } else {
      // Create new mastery record
      const initialAccuracy = isCorrect ? 100 : 0;
      const initialMasteryLevel = 'beginner';
      
      await tx
        .insert(topic_mastery)
        .values({
          user_id: userId,
          topic_id: topicId,
          mastery_level: initialMasteryLevel,
          questions_attempted: 1,
          questions_correct: isCorrect ? 1 : 0,
          accuracy_percentage: initialAccuracy,
          last_practiced: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
      
      updatedMasteryInfo = {
        mastery_level: initialMasteryLevel,
        questions_attempted: 1,
        questions_correct: isCorrect ? 1 : 0,
        accuracy_percentage: initialAccuracy
      };
    }
    return updatedMasteryInfo;
  });

  // After the transaction is successful, invalidate caches
  // First, get the subject_id for the given topicId
  let subjectIdForCacheClear: number | string = 'all';
  if (topicId) { 
      try {
          const topicData = await db.select({ subject_id: topics.subject_id })
                                        .from(topics)
                                        .where(eq(topics.topic_id, topicId))
                                        .limit(1);
          if (topicData.length > 0 && topicData[0].subject_id) {
              subjectIdForCacheClear = topicData[0].subject_id;
          }
      } catch (dbError) {
          console.error(`Error fetching subject_id for topic ${topicId} during cache invalidation:`, dbError);
      }
  }

  const masteryCachePattern = `user:${userId}:topic-mastery:*`;
  // More specific invalidations (optional, covered by pattern):
  // const specificMasteryCacheKey = `user:${userId}:topic-mastery:subject:${subjectIdForCacheClear}`;
  // const allTopicsMasteryCacheKey = `user:${userId}:topic-mastery:all-topics:subject:${subjectIdForCacheClear}`;
  // const allTopicsMasteryGlobalKey = `user:${userId}:topic-mastery:all-topics:subject:all`;

  try {
      await cache.deletePattern(masteryCachePattern); // Broad invalidation
      console.log(`Topic mastery caches invalidated for user ${userId} using pattern ${masteryCachePattern}. Topic ${topicId}, Subject ${subjectIdForCacheClear}`);
  } catch (cacheError) {
      console.error('Error during topic mastery cache invalidation:', cacheError);
  }

  return result;
}