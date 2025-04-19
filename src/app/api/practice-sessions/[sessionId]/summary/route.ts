// src/app/api/practice-sessions/[sessionId]/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  practice_sessions, 
  session_questions,
  question_attempts,
  questions,
  topics,
  //subtopics
} from '@/db';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

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

    // Get the session details
    const session = await db.query.practice_sessions.findFirst({
      where: and(
        eq(practice_sessions.session_id, sessionId),
        eq(practice_sessions.user_id, userId)
      )
    });

    if (!session) {
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

    // Process question data to calculate overall statistics
    const totalQuestions = sessionQuestionData.length;
    let questionsCorrect = 0;
    let score = 0;
    let maxScore = 0;
    let totalTimeSeconds = 0;

    // For tracking topic performance
    const topicMap = new Map<number, {
      topicName: string;
      questionsTotal: number;
      questionsCorrect: number;
    }>();

    sessionQuestionData.forEach(question => {
      // Count correct questions
      if (question.isCorrect) {
        questionsCorrect++;
      }

      // Calculate score
      score += question.marksAwarded || 0;
      maxScore += question.marksPossible || 0;

      // Track time
      totalTimeSeconds += question.timeTaken || 0;

      // Track topic performance
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
        topicStats.questionsCorrect++;
      }
    });

    // Calculate overall accuracy
    const accuracy = totalQuestions > 0 
      ? Math.round((questionsCorrect / totalQuestions) * 100) 
      : 0;

    // Convert time from seconds to minutes
    const timeTakenMinutes = Math.round(totalTimeSeconds / 60);

    // Format topic performance data
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
      .sort((a, b) => b.questionsTotal - a.questionsTotal); // Sort by number of questions

    // Format the summary data
    const summary = {
      sessionId,
      totalQuestions,
      questionsCorrect,
      questionsIncorrect: totalQuestions - questionsCorrect,
      accuracy,
      timeTakenMinutes,
      score,
      maxScore,
      topicPerformance
    };

    // Also update the session record with the final stats
    await db.update(practice_sessions)
      .set({
        end_time: new Date(),
        duration_minutes: timeTakenMinutes,
        questions_attempted: totalQuestions,
        questions_correct: questionsCorrect,
        score: score,
        max_score: maxScore,
        is_completed: true,
        updated_at: new Date()
      })
      .where(
        and(
          eq(practice_sessions.session_id, sessionId),
          eq(practice_sessions.user_id, userId)
        )
      );

    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('Error generating session summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
