// src/app/api/practice-sessions/[sessionId]/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  question_attempts, 
  questions, 
  topics, 
  subtopics, 
  practice_sessions,
  session_questions
} from '@/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    const sessionId = parseInt((await params).sessionId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // First verify that the session belongs to this user
    const session = await db.query.practice_sessions.findFirst({
      where: and(
        eq(practice_sessions.session_id, sessionId),
        eq(practice_sessions.user_id, userId)
      ),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or does not belong to the current user' },
        { status: 404 }
      );
    }

    // Get all question attempts for this session
    const attempts = await db.query.question_attempts.findMany({
      where: and(
        eq(question_attempts.session_id, sessionId),
        eq(question_attempts.user_id, userId)
      ),
      orderBy: question_attempts.attempt_timestamp,
      with: {
        question: true
      }
    });

    if (!attempts.length) {
      return NextResponse.json({ 
        attempts: [], 
        summary: {
          totalQuestions: 0,
          questionsCorrect: 0,
          accuracy: 0,
          score: 0,
          maxScore: 0
        }
      });
    }

    // Get session questions to ensure correct ordering
    const sessionQs = await db.query.session_questions.findMany({
      where: and(
        eq(session_questions.session_id, sessionId),
        eq(session_questions.user_id, userId)
      ),
      orderBy: session_questions.question_order,
      columns: {
        question_id: true,
        question_order: true,
        time_spent_seconds: true
      }
    });

    // Create an object map of question IDs to their order
    const questionOrderMap: Record<number, { order: number, timeSpent: number }> = {};
    sessionQs.forEach(sq => {
      questionOrderMap[sq.question_id] = { 
        order: sq.question_order, 
        timeSpent: sq.time_spent_seconds ?? 0 // Use nullish coalescing to handle null values
      };
    });

    // Prepare the list of attempts with all needed data
    const detailedAttempts = await Promise.all(attempts.map(async (attempt) => {
      // Get topic information
      const topic = await db.query.topics.findFirst({
        where: eq(topics.topic_id, attempt.question.topic_id),
        columns: {
          topic_id: true,
          topic_name: true
        }
      });

      // Get subtopic information if available
      let subtopicInfo = null;
      if (attempt.question.subtopic_id) {
        const subtopic = await db.query.subtopics.findFirst({
          where: eq(subtopics.subtopic_id, attempt.question.subtopic_id),
          columns: {
            subtopic_id: true,
            subtopic_name: true
          }
        });
        
        if (subtopic) {
          subtopicInfo = {
            subtopicId: subtopic.subtopic_id,
            subtopicName: subtopic.subtopic_name
          };
        }
      }

      // Get the question order and time spent
      const orderInfo = questionOrderMap[attempt.question_id] || { order: 0, timeSpent: 0 };

      // Format the attempt data
      return {
        questionId: attempt.question.question_id,
        questionNumber: orderInfo.order,
        timeSpentSeconds: orderInfo.timeSpent,
        questionText: attempt.question.question_text,
        questionType: attempt.question.question_type,
        details: attempt.question.details,
        explanation: attempt.question.explanation,
        userAnswer: attempt.user_answer,
        isCorrect: attempt.is_correct,
        correctAnswer: getCorrectAnswer(attempt.question.details, attempt.question.question_type),
        marksAwarded: attempt.marks_awarded || 0,
        maxMarks: attempt.question.marks || 0,
        topic: {
          topicId: topic?.topic_id || 0,
          topicName: topic?.topic_name || 'Unknown Topic'
        },
        subtopic: subtopicInfo,
        isImageBased: attempt.question.is_image_based,
        imageUrl: attempt.question.image_url
      };
    }));

    // Sort attempts by question order
    detailedAttempts.sort((a, b) => a.questionNumber - b.questionNumber);

    // Generate session summary data
    const summary = {
      totalQuestions: detailedAttempts.length,
      questionsCorrect: detailedAttempts.filter(a => a.isCorrect).length,
      accuracy: Math.round((detailedAttempts.filter(a => a.isCorrect).length / detailedAttempts.length) * 100),
      score: detailedAttempts.reduce((sum, attempt) => sum + (attempt.marksAwarded || 0), 0),
      maxScore: detailedAttempts.reduce((sum, attempt) => sum + (attempt.maxMarks || 0), 0)
    };

    // Create a safe copy of the data without any non-serializable values
    const safeData = {
      attempts: detailedAttempts.map((attempt: any) => ({
        ...attempt,
        // Ensure all properties are serializable
        details: attempt.details ? JSON.parse(JSON.stringify(attempt.details)) : null,
        userAnswer: attempt.userAnswer ? JSON.parse(JSON.stringify(attempt.userAnswer)) : null,
        correctAnswer: attempt.correctAnswer ? JSON.parse(JSON.stringify(attempt.correctAnswer)) : null
      })),
      summary
    };
    
    return NextResponse.json(safeData);
  } catch (error) {
    console.error('Error in session review API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve session review data' },
      { status: 500 }
    );
  }
}

// Helper function to extract the correct answer based on question type
function getCorrectAnswer(details: any, questionType: string): any {
  try {
    switch (questionType) {
      case 'MultipleChoice':
        // Find the correct option
        const correctOption = details.options.find((opt: any) => opt.isCorrect);
        return { selectedOption: correctOption ? correctOption.key : null };
        
      case 'Matching':
        // Extract the correct matches
        const matches: Record<string, string> = {};
        details.items.forEach((item: any) => {
          matches[item.key] = item.matchesTo;
        });
        return { matches };
        
      case 'MultipleCorrectStatements':
        // Find all correct statements
        const correctStatements = details.statements
          .filter((statement: any) => statement.isCorrect)
          .map((statement: any) => statement.key);
        return { selectedStatements: correctStatements };
        
      case 'AssertionReason':
        // Return the correct selection
        return { selection: details.correctOption };
        
      case 'SequenceOrdering':
        // Return the correct sequence
        return { sequence: details.correctSequence };
        
      default:
        return null;
    }
  } catch (e) {
    console.error(`Error extracting correct answer for ${questionType}:`, e);
    return null;
  }
}
