// File: src/lib/dashboard/server-data.ts

import { db } from '@/db';
import {
  practice_sessions,
  subjects,
  topics,
  topic_mastery,
  question_attempts,
  questions,
} from '@/db/schema';
import { and, count, desc, eq, gte, sum } from 'drizzle-orm';
import { DashboardData, SessionSummary, TopicMastery as TopicMasteryType, UserStats, QuestionTypeData } from '@/types/dashboard';

/**
 * Derive subject performance from sessions (same logic as client helper).
 */
function deriveSubjectPerformance(sessions: SessionSummary[]) {
  const subjectMap = new Map<string, { totalAccuracy: number; count: number }>();

  sessions.forEach((session) => {
    if (!session.subject_name) return;

    const current = subjectMap.get(session.subject_name) || { totalAccuracy: 0, count: 0 };
    subjectMap.set(session.subject_name, {
      totalAccuracy: current.totalAccuracy + session.accuracy,
      count: current.count + 1,
    });
  });

  return Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    accuracy: Math.round(data.totalAccuracy / data.count),
  }));
}

/**
 * Derive performance over time data from sessions (last 7 by date).
 */
function derivePerformanceData(sessions: SessionSummary[]) {
  const sortedSessions = [...sessions]
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(-7);

  return sortedSessions.map((session) => {
    const date = new Date(session.start_time);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      accuracy: Math.round(session.accuracy),
      score: session.score || 0,
    };
  });
}

function generateFocusAreas(topicMasteryRows: TopicMasteryType[]) {
  return [...topicMasteryRows]
    .filter((topic) => topic.accuracy_percentage < 70)
    .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
    .slice(0, 3)
    .map((topic) => ({
      name: topic.topic_name,
      accuracy: topic.accuracy_percentage,
    }));
}

function generateStrongAreas(topicMasteryRows: TopicMasteryType[]) {
  return [...topicMasteryRows]
    .filter((topic) => topic.accuracy_percentage >= 80)
    .sort((a, b) => b.accuracy_percentage - a.accuracy_percentage)
    .slice(0, 3)
    .map((topic) => ({
      name: topic.topic_name,
      accuracy: topic.accuracy_percentage,
    }));
}

async function fetchRecentSessionsServer(userId: string, limit = 10): Promise<SessionSummary[]> {
  const rows = await db
    .select({
      session_id: practice_sessions.session_id,
      session_type: practice_sessions.session_type,
      start_time: practice_sessions.start_time,
      end_time: practice_sessions.end_time,
      subject_name: subjects.subject_name,
      topic_name: topics.topic_name,
      questions_attempted: practice_sessions.questions_attempted,
      questions_correct: practice_sessions.questions_correct,
      score: practice_sessions.score,
      max_score: practice_sessions.max_score,
      duration_minutes: practice_sessions.duration_minutes,
      is_completed: practice_sessions.is_completed,
    })
    .from(practice_sessions)
    .leftJoin(subjects, eq(practice_sessions.subject_id, subjects.subject_id))
    .leftJoin(topics, eq(practice_sessions.topic_id, topics.topic_id))
    .where(eq(practice_sessions.user_id, userId))
    .orderBy(desc(practice_sessions.start_time))
    .limit(limit);

  return rows.map((session) => {
    const questionsAttempted = session.questions_attempted ?? 0;
    const questionsCorrect = session.questions_correct ?? 0;
    const accuracy =
      questionsAttempted > 0 ? (questionsCorrect / questionsAttempted) * 100 : 0;

    return {
      session_id: session.session_id,
      session_type: session.session_type,
      start_time: session.start_time.toISOString(),
      end_time: session.end_time ? session.end_time.toISOString() : null,
      subject_name: session.subject_name || '',
      topic_name: session.topic_name || null,
      questions_attempted: questionsAttempted,
      questions_correct: questionsCorrect,
      score: session.score ?? null,
      max_score: session.max_score ?? null,
      duration_minutes: session.duration_minutes ?? null,
      is_completed: Boolean(session.is_completed),
      accuracy,
    } satisfies SessionSummary;
  });
}

async function fetchTopicMasteryServer(userId: string): Promise<TopicMasteryType[]> {
  const rows = await db
    .select({
      mastery_id: topic_mastery.mastery_id,
      user_id: topic_mastery.user_id,
      topic_id: topic_mastery.topic_id,
      topic_name: topics.topic_name,
      mastery_level: topic_mastery.mastery_level,
      questions_attempted: topic_mastery.questions_attempted,
      questions_correct: topic_mastery.questions_correct,
      accuracy_percentage: topic_mastery.accuracy_percentage,
      last_practiced: topic_mastery.last_practiced,
      streak_count: topic_mastery.streak_count,
      subject_id: topics.subject_id,
    })
    .from(topic_mastery)
    .innerJoin(topics, eq(topic_mastery.topic_id, topics.topic_id))
    .where(eq(topic_mastery.user_id, userId))
    .orderBy(desc(topic_mastery.last_practiced))
    .limit(100);

  return rows.map((row) => ({
    ...row,
    // Ensure non-null numeric accuracy and string date to satisfy TopicMastery type
    accuracy_percentage: row.accuracy_percentage ?? 0,
    last_practiced: (row.last_practiced ?? new Date(0)).toISOString(),
  })) as TopicMasteryType[];
}

async function fetchUserStatsServer(userId: string): Promise<UserStats> {
  // Total sessions
  const sessionsResult = await db
    .select({ count: count() })
    .from(practice_sessions)
    .where(eq(practice_sessions.user_id, userId));

  const totalSessions = Number(sessionsResult[0]?.count || 0);

  // Total questions & duration
  const questionsResult = await db
    .select({
      attempted: sum(practice_sessions.questions_attempted),
      correct: sum(practice_sessions.questions_correct),
      duration: sum(practice_sessions.duration_minutes),
    })
    .from(practice_sessions)
    .where(eq(practice_sessions.user_id, userId));

  const totalQuestionsAttempted = Number(questionsResult[0]?.attempted || 0);
  const totalCorrectAnswers = Number(questionsResult[0]?.correct || 0);
  const totalDurationMinutes = Number(questionsResult[0]?.duration || 0);

  const averageAccuracy =
    totalQuestionsAttempted > 0
      ? (totalCorrectAnswers / totalQuestionsAttempted) * 100
      : 0;

  // Mastered topics
  const masteredResult = await db
    .select({ count: count() })
    .from(topic_mastery)
    .where(
      and(eq(topic_mastery.user_id, userId), eq(topic_mastery.mastery_level, 'mastered')),
    );

  const masteredTopics = Number(masteredResult[0]?.count || 0);

  // Simple streak (similar placeholder as API)
  const today = new Date();
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(today.getDate() - 1);

  const yesterdayActivity = await db
    .select({ count: count() })
    .from(practice_sessions)
    .where(
      and(
        eq(practice_sessions.user_id, userId),
        gte(practice_sessions.start_time, yesterdayDate),
      ),
    );

  const streakCount = Number(yesterdayActivity[0]?.count) > 0 ? 4 : 0;

  return {
    totalSessions,
    totalQuestionsAttempted,
    totalCorrectAnswers,
    averageAccuracy,
    totalDurationMinutes,
    streakCount,
    masteredTopics,
  };
}

async function fetchQuestionTypesServer(userId: string): Promise<QuestionTypeData[]> {
  const distribution = (await db
    .select({
      question_type: questions.question_type,
      count: count(),
    })
    .from(question_attempts)
    .innerJoin(questions, eq(question_attempts.question_id, questions.question_id))
    .where(eq(question_attempts.user_id, userId))
    .groupBy(questions.question_type)
    .limit(50)) as Array<{ question_type: string; count: number }>;

  if (!distribution.length) {
    return [
      { name: 'Multiple Choice', value: 65 },
      { name: 'Multiple Correct Statements', value: 15 },
      { name: 'Assertion Reason', value: 10 },
      { name: 'Matching', value: 5 },
      { name: 'Sequence Ordering', value: 5 },
    ];
  }

  return distribution.map((item) => {
    const name = item.question_type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return {
      name,
      value: Number(item.count),
    };
  });
}

/**
 * Server-side dashboard data fetcher used by the /dashboard page.
 * This avoids HTTP and uses the same data that the API routes expose,
 * but returns a DashboardData object directly for SSR.
 */
export async function fetchDashboardDataServer(userId: string): Promise<DashboardData> {
  try {
    const [recentSessions, topicMasteryRows, stats, questionTypes] = await Promise.all([
      fetchRecentSessionsServer(userId),
      fetchTopicMasteryServer(userId),
      fetchUserStatsServer(userId),
      fetchQuestionTypesServer(userId),
    ]);

    const subjectPerformance = deriveSubjectPerformance(recentSessions);
    const performanceOverTime = derivePerformanceData(recentSessions);
    const focusAreas = generateFocusAreas(topicMasteryRows);
    const strongAreas = generateStrongAreas(topicMasteryRows);

    return {
      recentSessions,
      topicMastery: topicMasteryRows,
      stats,
      questionTypeData: questionTypes,
      subjectPerformance,
      performanceOverTime,
      focusAreas,
      strongAreas,
      hasError: false,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data on server:', error);

    return {
      recentSessions: [],
      topicMastery: [],
      stats: {
        totalSessions: 0,
        totalQuestionsAttempted: 0,
        totalCorrectAnswers: 0,
        averageAccuracy: 0,
        totalDurationMinutes: 0,
        streakCount: 0,
        masteredTopics: 0,
      },
      questionTypeData: [],
      subjectPerformance: [],
      performanceOverTime: [],
      focusAreas: [],
      strongAreas: [],
      hasError: true,
    };
  }
}
