// src/lib/utilities/sessionUtils.ts
import { db } from '@/db';
import { practice_sessions, session_questions, question_attempts, questions, topic_mastery, topics } from '@/db/schema';
import { and, eq, sum, inArray } from 'drizzle-orm';
import { cache } from '@/lib/cache';

// Simple in-memory cache for session validation to avoid repeated DB checks
const sessionValidationCache = new Map<string, { timestamp: number, isValid: boolean, totalQuestions: number }>();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Updates session statistics based on question attempts
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
  // Check cache for session validation first
  const cacheKey = `${sessionId}:${userId}`;
  const now = Date.now();
  const cachedSession = sessionValidationCache.get(cacheKey);
  
  // Use cached session info if valid and recent
  let sessionInfo: { total_questions: number } | null = null;
  if (cachedSession && (now - cachedSession.timestamp) < SESSION_CACHE_TTL) {
    if (!cachedSession.isValid) {
      throw new Error('Session not found or does not belong to the user');
    }
    sessionInfo = { total_questions: cachedSession.totalQuestions };
  }

  // Use a transaction to ensure atomicity
  return await db.transaction(async (tx) => {
    let max_score = 0;
    let attemptStats: Array<{
      question_id: number;
      is_correct: boolean;
      marks_awarded: number | null;
      attempt_timestamp: Date;
    }> = [];

    if (!sessionInfo) {
      // Query session info and max score if not cached
      const [sessionAndMaxScoreQuery, attemptStatsQuery] = await Promise.all([
        tx
          .select({
            session_id: practice_sessions.session_id,
            total_questions: practice_sessions.total_questions,
            totalMarks: sum(questions.marks)
          })
          .from(practice_sessions)
          .innerJoin(session_questions, eq(practice_sessions.session_id, session_questions.session_id))
          .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
          .where(
            and(
              eq(practice_sessions.session_id, sessionId),
              eq(practice_sessions.user_id, userId)
            )
          )
          .groupBy(practice_sessions.session_id, practice_sessions.total_questions),

        tx
          .select({
            question_id: question_attempts.question_id,
            is_correct: question_attempts.is_correct,
            marks_awarded: question_attempts.marks_awarded,
            attempt_timestamp: question_attempts.attempt_timestamp
          })
          .from(question_attempts)
          .where(
            and(
              eq(question_attempts.session_id, sessionId),
              eq(question_attempts.user_id, userId)
            )
          )
          .orderBy(question_attempts.question_id, question_attempts.attempt_timestamp)
      ]);

      const [sessionAndMaxScore] = sessionAndMaxScoreQuery;
      attemptStats = attemptStatsQuery;

      if (!sessionAndMaxScore) {
        // Cache the negative result
        sessionValidationCache.set(cacheKey, { timestamp: now, isValid: false, totalQuestions: 0 });
        throw new Error('Session not found or does not belong to the user');
      }
      
      // Cache the positive result
      sessionValidationCache.set(cacheKey, { 
        timestamp: now, 
        isValid: true, 
        totalQuestions: sessionAndMaxScore.total_questions || 0 
      });
      
      sessionInfo = { total_questions: sessionAndMaxScore.total_questions || 0 };
      max_score = sessionAndMaxScore.totalMarks ? parseInt(String(sessionAndMaxScore.totalMarks), 10) : 0;
    } else {
      // For cached sessions, execute queries in parallel
      const [attemptStatsQuery, maxScoreQuery] = await Promise.all([
        tx
          .select({
            question_id: question_attempts.question_id,
            is_correct: question_attempts.is_correct,
            marks_awarded: question_attempts.marks_awarded,
            attempt_timestamp: question_attempts.attempt_timestamp
          })
          .from(question_attempts)
          .where(
            and(
              eq(question_attempts.session_id, sessionId),
              eq(question_attempts.user_id, userId)
            )
          )
          .orderBy(question_attempts.question_id, question_attempts.attempt_timestamp),

        tx
          .select({ totalMarks: sum(questions.marks) })
          .from(session_questions)
          .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
          .where(eq(session_questions.session_id, sessionId))
      ]);

      attemptStats = attemptStatsQuery;
      const [maxScoreResult] = maxScoreQuery;
      max_score = maxScoreResult?.totalMarks ? parseInt(String(maxScoreResult.totalMarks), 10) : 0;
    }

    // Optimized single-pass processing of attempt statistics
    const questionStats = new Map<number, {
      isCorrect: boolean,
      marksAwarded: number,
      latestTimestamp: Date
    }>();

    // Single pass to get latest attempt for each question
    let questions_attempted = 0;
    let questions_correct = 0;
    let score = 0;

    for (const attempt of attemptStats) {
      const questionId = attempt.question_id;
      const currentStat = questionStats.get(questionId);
      
      if (!currentStat || attempt.attempt_timestamp > currentStat.latestTimestamp) {
        const newStat = {
          isCorrect: attempt.is_correct,
          marksAwarded: Number(attempt.marks_awarded ?? 0),
          latestTimestamp: attempt.attempt_timestamp
        };
        
        // If this is a replacement, subtract old stats
        if (currentStat) {
          if (currentStat.isCorrect) questions_correct--;
          score -= currentStat.marksAwarded;
        } else {
          // New question attempt
          questions_attempted++;
        }
        
        // Add new stats
        if (newStat.isCorrect) questions_correct++;
        score += newStat.marksAwarded;
        
        questionStats.set(questionId, newStat);
      }
    }

    // Ensure questions_attempted doesn't exceed total_questions
    questions_attempted = Math.min(questions_attempted, sessionInfo.total_questions);

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
 * @param userNotes User notes for the attempt (optional)
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
    const insertPromise = tx
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

    // Update the time spent on the question if provided (parallel execution)
    const updatePromise = timeTakenSeconds 
      ? tx
          .update(session_questions)
          .set({ time_spent_seconds: timeTakenSeconds })
          .where(eq(session_questions.session_question_id, sessionQuestionId))
      : Promise.resolve();

    // Execute both operations in parallel
    const [attemptResult] = await Promise.all([insertPromise, updatePromise]);
    const [newAttempt] = attemptResult;

    // Update session statistics immediately (optimized version)
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

/**
 * Updates topic mastery levels for multiple topics in a batch operation
 * This is more efficient than calling updateTopicMastery individually for each topic
 * 
 * @param userId User ID
 * @param topicUpdates Array of topic updates with topicId and isCorrect
 * @returns Array of updated mastery information
 */
export async function updateTopicMasteryBatch(
  userId: string,
  topicUpdates: Array<{ topicId: number, isCorrect: boolean }>
): Promise<Array<{
  topicId: number,
  mastery_level: string,
  questions_attempted: number,
  questions_correct: number,
  accuracy_percentage: number
}>> {
  if (topicUpdates.length === 0) {
    return [];
  }

  const results = await db.transaction(async (tx) => {
    // Group updates by topic ID and aggregate correct/incorrect counts
    const topicAggregates = new Map<number, { questionsAttempted: number, questionsCorrect: number }>();
    
    for (const update of topicUpdates) {
      const existing = topicAggregates.get(update.topicId) || { questionsAttempted: 0, questionsCorrect: 0 };
      topicAggregates.set(update.topicId, {
        questionsAttempted: existing.questionsAttempted + 1,
        questionsCorrect: existing.questionsCorrect + (update.isCorrect ? 1 : 0)
      });
    }
    
    const topicIds = Array.from(topicAggregates.keys());
    
    // Get current mastery levels for all topics in one query
    const existingMasteries = await tx
      .select()
      .from(topic_mastery)
      .where(
        and(
          eq(topic_mastery.user_id, userId),
          topicIds.length === 1 
            ? eq(topic_mastery.topic_id, topicIds[0])
            : inArray(topic_mastery.topic_id, topicIds)
        )
      );

    // Create a map for quick lookup
    const masteryMap = new Map(
      existingMasteries.map(m => [m.topic_id, m])
    );

    const updateResults = [];
    const insertsToMake = [];
    const updatesToMake = [];

    for (const [topicId, aggregates] of topicAggregates) {
      const existingMastery = masteryMap.get(topicId);

      if (existingMastery) {
        // Update existing mastery record
        const questionsAttempted = existingMastery.questions_attempted + aggregates.questionsAttempted;
        const questionsCorrect = existingMastery.questions_correct + aggregates.questionsCorrect;
        const accuracyPercentage = Math.round((questionsCorrect / questionsAttempted) * 100);
        
        let masteryLevel: 'notStarted' | 'beginner' | 'intermediate' | 'advanced' | 'mastered' = existingMastery.mastery_level as 'notStarted' | 'beginner' | 'intermediate' | 'advanced' | 'mastered';
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

        updatesToMake.push({
          topicId,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          accuracy_percentage: accuracyPercentage,
          mastery_level: masteryLevel
        });

        updateResults.push({
          topicId,
          mastery_level: masteryLevel,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          accuracy_percentage: accuracyPercentage
        });
      } else {
        // Create new mastery record
        const initialAccuracy = aggregates.questionsAttempted > 0 
          ? Math.round((aggregates.questionsCorrect / aggregates.questionsAttempted) * 100) 
          : 0;
        const initialMasteryLevel = 'beginner' as const;

        insertsToMake.push({
          user_id: userId,
          topic_id: topicId,
          mastery_level: initialMasteryLevel,
          questions_attempted: aggregates.questionsAttempted,
          questions_correct: aggregates.questionsCorrect,
          accuracy_percentage: initialAccuracy,
          last_practiced: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });

        updateResults.push({
          topicId,
          mastery_level: initialMasteryLevel,
          questions_attempted: aggregates.questionsAttempted,
          questions_correct: aggregates.questionsCorrect,
          accuracy_percentage: initialAccuracy
        });
      }
    }

    // Perform batch inserts
    if (insertsToMake.length > 0) {
      await tx.insert(topic_mastery).values(insertsToMake);
    }

    // Perform batch updates
    for (const updateData of updatesToMake) {
      await tx
        .update(topic_mastery)
        .set({
          questions_attempted: updateData.questions_attempted,
          questions_correct: updateData.questions_correct,
          accuracy_percentage: updateData.accuracy_percentage,
          mastery_level: updateData.mastery_level,
          last_practiced: new Date(),
          updated_at: new Date()
        })
        .where(
          and(
            eq(topic_mastery.user_id, userId),
            eq(topic_mastery.topic_id, updateData.topicId)
          )
        );
    }

    return updateResults;
  });

  // Optimized batch cache invalidation after transaction
  try {
    // Only invalidate cache if we actually made updates
    if (results.length > 0) {
      const masteryCachePattern = `user:${userId}:topic-mastery:*`;
      await cache.deletePattern(masteryCachePattern);
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Batch topic mastery caches invalidated for user ${userId}, topics: ${topicUpdates.map(u => u.topicId).join(', ')}`);
      }
    }
  } catch (cacheError) {
    console.error('Error during batch topic mastery cache invalidation:', cacheError);
  }

  return results;
}