// src/app/api/practice-sessions/[sessionId]/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  practice_sessions, 
  session_questions,
  question_attempts,
  questions,
  topics,
} from '@/db';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache'; // Import cache

interface TopicPerformance {
  topicId: number;
  topicName: string;
  questionsCorrect: number;
  questionsTotal: number;
  accuracy: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Access the sessionId from params
    const sessionId = parseInt((await params).sessionId);

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const cacheKey = `session:${userId}:${sessionId}:summary`;

    // Try to get from cache first
    const cachedSummary = await cache.get(cacheKey);
    if (cachedSummary) {
      return NextResponse.json({ ...(cachedSummary as Record<string,unknown>), source: 'cache' });
    }
    
    const { updateSessionStats } = await import('@/lib/utilities/sessionUtils');
    await updateSessionStats(sessionId, userId); // This ensures session stats are up-to-date before fetching

    // Get the session details
    const [sessionFromDb] = await db // Renamed to avoid conflict with 'session' in summary
    .select()
    .from(practice_sessions)
    .where(
      and(
        eq(practice_sessions.session_id, sessionId),
        eq(practice_sessions.user_id, userId)
      )
    );

    if (!sessionFromDb) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get all questions in this session with their attempts
    const sessionQuestionData = await db.select({
      questionId: session_questions.question_id,
      topicId: questions.topic_id,
      topicName: topics.topic_name,
      isCorrect: question_attempts.is_correct,
      marksAwarded: question_attempts.marks_awarded,
      marksPossible: questions.marks,
      timeTaken: session_questions.time_spent_seconds
    })
    .from(session_questions)
    .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
    .innerJoin(topics, eq(questions.topic_id, topics.topic_id))
    .leftJoin(
      question_attempts, 
      and(
        eq(question_attempts.session_id, sessionId),
        eq(question_attempts.question_id, session_questions.question_id),
        eq(question_attempts.user_id, userId)
      )
    )
    .where(
      and(
        eq(session_questions.session_id, sessionId),
        eq(session_questions.user_id, userId)
      )
    );

    const totalQuestions = sessionQuestionData.length;
    
    const topicMap = new Map<number, {
      topicName: string;
      questionsTotal: number;
      questionsCorrect: number;
    }>();

    const calculatedMetrics = sessionQuestionData.reduce((metrics, question) => {
      if (!topicMap.has(question.topicId)) {
        topicMap.set(question.topicId, {
          topicName: question.topicName,
          questionsTotal: 0,
          questionsCorrect: 0
        });
      }
      const topicStats = topicMap.get(question.topicId)!;
      topicStats.questionsTotal++;
      if (question.isCorrect) {
        metrics.questionsCorrect++;
        topicStats.questionsCorrect++;
      }
      metrics.score += question.marksAwarded || 0;
      metrics.maxScore += question.marksPossible || 0;
      metrics.totalTimeSeconds += question.timeTaken || 0;
      return metrics;
    }, {
      questionsCorrect: 0,
      score: 0,
      maxScore: 0,
      totalTimeSeconds: 0
    });

    const calculatedTimeTakenMinutes = Math.round(calculatedMetrics.totalTimeSeconds / 60);

    const topicPerformance: TopicPerformance[] = Array.from(topicMap.entries())
      .map(([topicId, stats]) => ({
        topicId,
        topicName: stats.topicName,
        questionsCorrect: stats.questionsCorrect,
        questionsTotal: stats.questionsTotal,
        accuracy: stats.questionsTotal > 0 
          ? Math.round((stats.questionsCorrect / stats.questionsTotal) * 100)
          : 0
      }))
      .sort((a, b) => b.questionsTotal - a.questionsTotal); 

    const summaryData = { // Renamed to avoid conflict
      sessionId,
      totalQuestions: sessionFromDb.total_questions ?? 0,
      questionsAttempted: sessionFromDb.questions_attempted ?? 0,
      questionsCorrect: sessionFromDb.questions_correct ?? 0,
      questionsIncorrect: (sessionFromDb.questions_attempted ?? 0) - (sessionFromDb.questions_correct ?? 0),
      accuracy: (sessionFromDb.questions_attempted ?? 0) > 0 
        ? Math.round(((sessionFromDb.questions_correct ?? 0) / (sessionFromDb.questions_attempted ?? 1)) * 100)
        : 0,
      calculatedAccuracy: totalQuestions > 0 
        ? Math.round((calculatedMetrics.questionsCorrect / totalQuestions) * 100)
        : 0,
      timeTakenMinutes: sessionFromDb.duration_minutes ?? calculatedTimeTakenMinutes, 
      score: sessionFromDb.score ?? calculatedMetrics.score, 
      maxScore: sessionFromDb.max_score || calculatedMetrics.maxScore,
      topicPerformance
    };

    // Ensure session is marked as completed if not already (idempotent)
    if (!sessionFromDb.is_completed) {
        await db.update(practice_sessions)
        .set({
          end_time: sessionFromDb.end_time || new Date(), // Use existing end_time if already set
          is_completed: true,
          updated_at: new Date()
        })
        .where(
          and(
            eq(practice_sessions.session_id, sessionId),
            eq(practice_sessions.user_id, userId)
          )
        );
    }
    
    // Cache the result
    await cache.set(cacheKey, summaryData, 7200); // 7200 seconds = 2 hours

    return NextResponse.json({ ...summaryData, source: 'database' });
    
  } catch (error) {
    console.error('Error generating session summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}