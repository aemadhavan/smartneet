// src/app/api/practice-sessions/[sessionId]/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  question_attempts,
  topics,
  subtopics,
  practice_sessions,
  session_questions,
  // subjects is needed for session context
  //subjects 
} from '@/db';
import { eq, and, desc, inArray } from 'drizzle-orm'; // Added inArray
import { auth } from '@clerk/nextjs/server';
import { getCorrectAnswer } from '@/app/practice-sessions/[sessionId]/review/components/helpers';
import { 
  NormalizedQuestionDetails, 
  QuestionType, 
  NormalizedAnswer 
} from '@/app/practice-sessions/[sessionId]/review/components/interfaces';
import { cache } from '@/lib/cache'; // Import cache

// Add connection pooling and retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      
      // Check if it's a concurrency limit error
      if (
        typeof error === 'object' && 
        error !== null && 
        ('code' in error && error.code === 'XATA_CONCURRENCY_LIMIT' || 
         ('message' in error && typeof error.message === 'string' && 
          error.message.includes('concurrent connections limit exceeded')))
      ) {
        attempt++;
        console.log(`Connection limit exceeded, retrying in ${RETRY_DELAY * attempt}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
  
  throw lastError!;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    
    // Await the params and then parse the sessionId
    const { sessionId: sessionIdParam } = await params;
    const sessionId = parseInt(sessionIdParam);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const cacheKey = `session:${userId}:${sessionId}:review`;

    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ ...(cachedData as Record<string, unknown>), source: 'cache' });
    }

    // First verify that the session belongs to this user and fetch its details
    // Also fetch related subject, topic, subtopic names for comprehensive review context
    const sessionDetails = await withRetry(async () => {
      return db.query.practice_sessions.findFirst({
        where: and(
          eq(practice_sessions.session_id, sessionId),
          eq(practice_sessions.user_id, userId)
        ),
        with: {
          subject: { columns: { subject_name: true } },
          topic: { columns: { topic_name: true } },
          subtopic: { columns: { subtopic_name: true } }
        }
      });
    });

    if (!sessionDetails) {
      return NextResponse.json(
        { error: 'Session not found or does not belong to the current user' },
        { status: 404 }
      );
    }

    // Get all question attempts for this session, ordered by attempt_timestamp descending
    // to easily pick the latest attempt if multiple exist for a single question (though typically not expected)
    const attempts = await withRetry(async () => {
      return db.query.question_attempts.findMany({
        where: and(
          eq(question_attempts.session_id, sessionId),
          eq(question_attempts.user_id, userId)
        ),
        orderBy: desc(question_attempts.attempt_timestamp), // Get latest attempts first
        with: {
          question: {
            columns: {
              question_id: true,
              question_text: true,
              question_type: true,
              details: true, // Contains options and structure for correct answer
              explanation: true,
              marks: true, // Max marks for the question
              negative_marks: true, // Negative marks for the question
              difficulty_level: true, // Difficulty of the question
              topic_id: true,
              subtopic_id: true,
              is_image_based: true,
              image_url: true
            }
          }
        }
      });
    });
    
    // If no attempts, still return basic session info and empty attempts/summary
    // This part does not need separate caching as the main response will be cached.
    if (!attempts.length) {
      const questionsAttempted = sessionDetails.questions_attempted ?? 0;
      const questionsCorrect = sessionDetails.questions_correct ?? 0;
      const accuracy = questionsAttempted > 0 
        ? Math.round((questionsCorrect / questionsAttempted) * 100) 
        : 0;

      const emptyResponse = {
        session: {
          session_id: sessionDetails.session_id,
          session_type: sessionDetails.session_type,
          start_time: sessionDetails.start_time,
          end_time: sessionDetails.end_time,
          duration_minutes: sessionDetails.duration_minutes,
          subject_name: sessionDetails.subject?.subject_name,
          topic_name: sessionDetails.topic?.topic_name,
          subtopic_name: sessionDetails.subtopic?.subtopic_name,
          total_questions: sessionDetails.total_questions,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          score: sessionDetails.score,
          max_score: sessionDetails.max_score,
          accuracy: accuracy,
        },
        attempts: [],
        summary: { // This summary might differ from finalSummary if attempts are empty
          totalQuestions: sessionDetails.total_questions || 0,
          questionsCorrect: questionsCorrect,
          accuracy: accuracy,
          score: sessionDetails.score || 0,
          maxScore: sessionDetails.max_score || 0,
        },
        source: 'database' // or 'empty_session_no_attempts' to be specific
      };
      await cache.set(cacheKey, emptyResponse, 7200); // Cache empty response too
      return NextResponse.json(emptyResponse);
    }

    // Get session questions to map is_bookmarked, question_order, time_spent_seconds
    const sessionQsData = await db.query.session_questions.findMany({
      where: and(
        eq(session_questions.session_id, sessionId),
        eq(session_questions.user_id, userId) // Ensure user_id matches here too for security
      ),
      columns: {
        question_id: true,
        question_order: true,
        time_spent_seconds: true,
        is_bookmarked: true 
      }
    });

    // Create a map for easy lookup of session question details
    const sessionQuestionDetailsMap: Record<number, { order: number, timeSpent: number, isBookmarked: boolean }> = {};
    sessionQsData.forEach(sq => {
      sessionQuestionDetailsMap[sq.question_id] = { 
        order: sq.question_order, 
        timeSpent: sq.time_spent_seconds ?? 0,
        isBookmarked: sq.is_bookmarked ?? false
      };
    });
    
    const topicIdsFromAttempts = new Set<number>();
    const subtopicIdsFromAttempts = new Set<number>();

    attempts.forEach(attempt => {
      if (attempt.question.topic_id) {
        topicIdsFromAttempts.add(attempt.question.topic_id);
      }
      if (attempt.question.subtopic_id) {
        subtopicIdsFromAttempts.add(attempt.question.subtopic_id);
      }
    });

    let topicMap = new Map<number, { topic_id: number; topic_name: string }>();
    if (topicIdsFromAttempts.size > 0) {
      const topicsData = await withRetry(async () => {
        return db.query.topics.findMany({
          where: inArray(topics.topic_id, Array.from(topicIdsFromAttempts)),
          columns: { topic_id: true, topic_name: true }
        });
      });
      topicMap = new Map(topicsData.map(t => [t.topic_id, t]));
    }

    let subtopicMap = new Map<number, { subtopic_id: number; subtopic_name: string }>();
    if (subtopicIdsFromAttempts.size > 0) {
      const subtopicsData = await withRetry(async () => {
        return db.query.subtopics.findMany({
          where: inArray(subtopics.subtopic_id, Array.from(subtopicIdsFromAttempts)),
          columns: { subtopic_id: true, subtopic_name: true }
        });
      });
      subtopicMap = new Map(subtopicsData.map(st => [st.subtopic_id, st]));
    }

    const detailedReviewQuestions = sessionQsData.map(sq => {
        const attempt = attempts.find(a => a.question_id === sq.question_id); 

        const topicInfoFromMap = attempt?.question.topic_id ? topicMap.get(attempt.question.topic_id) : null;
        
        let subtopicInfoFromMap = null;
        if (attempt?.question.subtopic_id) {
          const subtopicData = subtopicMap.get(attempt.question.subtopic_id);
          if (subtopicData) {
            subtopicInfoFromMap = {
              subtopicId: subtopicData.subtopic_id,
              subtopicName: subtopicData.subtopic_name
            };
          }
        }
        
        const questionDetails = attempt?.question.details as NormalizedQuestionDetails | null;
        const questionType = attempt?.question.question_type as QuestionType | undefined;

        return {
          question_id: sq.question_id,
          question_order: sessionQuestionDetailsMap[sq.question_id]?.order ?? 0, 
          time_spent_seconds: sessionQuestionDetailsMap[sq.question_id]?.timeSpent ?? 0, 
          is_bookmarked: sessionQuestionDetailsMap[sq.question_id]?.isBookmarked ?? false, 
          question_text: attempt?.question.question_text || "N/A (Question data missing)",
          question_type: questionType || "N/A",
          details: questionDetails,
          explanation: attempt?.question.explanation,
          user_answer: attempt?.user_answer as NormalizedAnswer | null,
          is_correct: attempt?.is_correct ?? null,
          correct_answer: questionDetails && questionType ? getCorrectAnswer(questionDetails, questionType) : null,
          marks_awarded: attempt?.marks_awarded ?? 0,
          marks_available: attempt?.question.marks ?? 0,
          negative_marks: attempt?.question.negative_marks ?? 0,
          difficulty_level: attempt?.question.difficulty_level,
          topic: {
            topic_id: topicInfoFromMap?.topic_id,
            topic_name: topicInfoFromMap?.topic_name || "Unknown Topic"
          },
          subtopic: subtopicInfoFromMap,
          is_image_based: attempt?.question.is_image_based,
          image_url: attempt?.question.image_url
        };
      });

    detailedReviewQuestions.sort((a, b) => a.question_order - b.question_order);
    
    // Fix the null safety issues here
    const questionsAttempted = sessionDetails.questions_attempted ?? 0;
    const questionsCorrect = sessionDetails.questions_correct ?? 0;
    const accuracy = questionsAttempted > 0 
      ? Math.round((questionsCorrect / questionsAttempted) * 100) 
      : 0;

    const finalSummary = {
      total_questions: sessionDetails.total_questions,
      questions_attempted: questionsAttempted,
      questions_correct: questionsCorrect,
      accuracy: accuracy,
      score: sessionDetails.score,
      max_score: sessionDetails.max_score,
    };

    const dataToCache = {
      session: {
        session_id: sessionDetails.session_id,
        session_type: sessionDetails.session_type,
        start_time: sessionDetails.start_time,
        end_time: sessionDetails.end_time,
        duration_minutes: sessionDetails.duration_minutes,
        subject_name: sessionDetails.subject?.subject_name,
        topic_name: sessionDetails.topic?.topic_name,
        subtopic_name: sessionDetails.subtopic?.subtopic_name,
        ...finalSummary 
      },
      questions: detailedReviewQuestions.map(q => ({
        ...q,
        details: q.details ? JSON.parse(JSON.stringify(q.details)) : null,
        user_answer: q.user_answer ? JSON.parse(JSON.stringify(q.user_answer)) : null,
        correct_answer: q.correct_answer ? JSON.parse(JSON.stringify(q.correct_answer)) : null
      })),
    };
    
    await cache.set(cacheKey, dataToCache, 7200); // 7200 seconds = 2 hours

    return NextResponse.json({ ...dataToCache, source: 'database' });
  } catch (error) {
    console.error('Error in session review API:', error);
    
    // Add specific handling for concurrency errors
    if (
      error instanceof Error && 
      (error.message.includes('concurrent connections limit') || 
       (typeof error === 'object' && 
        error !== null && 
        'code' in error && 
        error.code === 'XATA_CONCURRENCY_LIMIT'))
    ) {
      return NextResponse.json(
        { error: 'Database is busy, please try again shortly' },
        { status: 503 }  // Service Unavailable
      );
    }
    
    // Log the detailed error for server-side inspection
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in session review API (details):', errorMessage, error); // Log full error object too

    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while retrieving session review data.' },
      { status: 500 }
    );
  }
}