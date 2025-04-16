// src/app/api/user-stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { practice_sessions, question_attempts, topic_mastery } from '@/db';
import { eq, count, sum, avg, and, gte } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get current date for streak calculation
    const today = new Date();
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);

    // Get total sessions count
    const sessionsResult = await db
      .select({ count: count() })
      .from(practice_sessions)
      .where(eq(practice_sessions.user_id, userId));
    
    const totalSessions = sessionsResult[0]?.count || 0;

    // Get total questions data
    const questionsResult = await db
      .select({
        attempted: sum(practice_sessions.questions_attempted),
        correct: sum(practice_sessions.questions_correct),
        duration: sum(practice_sessions.duration_minutes)
      })
      .from(practice_sessions)
      .where(eq(practice_sessions.user_id, userId));
    
    // Convert to numbers to ensure type safety
    const totalQuestionsAttempted = Number(questionsResult[0]?.attempted || 0);
    const totalCorrectAnswers = Number(questionsResult[0]?.correct || 0);
    const totalDurationMinutes = Number(questionsResult[0]?.duration || 0);

    // Calculate average accuracy
    const averageAccuracy = totalQuestionsAttempted > 0 
      ? (totalCorrectAnswers / totalQuestionsAttempted) * 100 
      : 0;

    // Count mastered topics
    const masteredResult = await db
      .select({ count: count() })
      .from(topic_mastery)
      .where(
        and(
          eq(topic_mastery.user_id, userId),
          eq(topic_mastery.mastery_level, 'mastered')
        )
      );
    
    const masteredTopics = masteredResult[0]?.count || 0;

    // Calculate streak (simplified version)
    // In a real app, you'd need a more sophisticated algorithm that checks
    // consecutive days with activity in the database
    const yesterdayActivity = await db
      .select({ count: count() })
      .from(practice_sessions)
      .where(
        and(
          eq(practice_sessions.user_id, userId),
          gte(practice_sessions.start_time, yesterdayDate)
        )
      );
    
    // This is a placeholder - in a real app you'd need to actually calculate
    // consecutive days streak from the database
    const streakCount = Number(yesterdayActivity[0]?.count) > 0 ? 4 : 0;

    return NextResponse.json({
      totalSessions,
      totalQuestionsAttempted,
      totalCorrectAnswers,
      averageAccuracy,
      totalDurationMinutes,
      streakCount,
      masteredTopics
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}