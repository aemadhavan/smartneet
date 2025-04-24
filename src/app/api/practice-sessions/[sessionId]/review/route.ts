// src/app/api/practice-sessions/[sessionId]/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  question_attempts,
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
        question: {
          columns: {
            question_id: true,
            question_text: true,
            question_type: true,
            details: true,
            explanation: true,
            marks: true,
            topic_id: true,
            subtopic_id: true,
            is_image_based: true,
            image_url: true
          }
        }
      }
    });

    interface QuestionWithDetails {
      question_id: number;
      question_text: string;
      question_type: string;
      details: QuestionDetails | null;
      explanation: string | null;
      marks: number | null;
      topic_id: number;
      subtopic_id: number | null;
      is_image_based: boolean | null;
      image_url: string | null;
    }

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
      // Define QuestionWithDetails type
      interface QuestionWithDetails {
        question_id: number;
        question_text: string;
        question_type: string;
        details: QuestionDetails | null;
        explanation: string | null;
        marks: number | null;
        topic_id: number;
        subtopic_id: number | null;
        is_image_based: boolean | null;
        image_url: string | null;
      }

      // Cast attempt.question to QuestionWithDetails
      const question = attempt.question as QuestionWithDetails;

      // Get topic information
      const topic = await db.query.topics.findFirst({
        where: eq(topics.topic_id, question.topic_id),
        columns: {
          topic_id: true,
          topic_name: true
        }
      });

      // Cast question.details to QuestionDetails | null
      // Get subtopic information if available
      let subtopicInfo = null;
      if (question.subtopic_id) {
        const subtopic = await db.query.subtopics.findFirst({
          where: eq(subtopics.subtopic_id, question.subtopic_id),
          columns: {
            subtopic_id: true,
            subtopic_name: true
          }
        });

        if (!subtopic) {
          subtopicInfo = null;
        } else {
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
        details: attempt.question.details as QuestionDetails | null,
        explanation: attempt.question.explanation,
        userAnswer: attempt.user_answer as AnswerType,
        isCorrect: attempt.is_correct,
        correctAnswer: getCorrectAnswer(attempt.question.details as QuestionDetails, attempt.question.question_type),
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
      attempts: detailedAttempts.map((attempt: DetailedAttempt) => ({
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

interface MultipleChoiceDetails {
  options: { key: string; isCorrect: boolean }[];
}

interface MatchingDetails {
  items: { key: string; matchesTo: string }[];
}

interface MultipleCorrectStatementsDetails {
  statements: { key: string; isCorrect: boolean }[];
}

interface AssertionReasonDetails {
  correctOption: string;
}

interface SequenceOrderingDetails {
  correctSequence: string[];
}

type QuestionDetails =
  | MultipleChoiceDetails
  | MatchingDetails
  | MultipleCorrectStatementsDetails
  | AssertionReasonDetails
  | SequenceOrderingDetails;

type CorrectAnswer =
  | { selectedOption: string | null }
  | { matches: Record<string, string> }
  | { selectedStatements: string[] }
  | { selection: string }
  | { sequence: string[] }
  | null;

type AnswerType =
  | string
  | number
  | string[]
  | number[]
  | Record<string, string>
  | null;

interface DetailedAttempt {
  questionId: number;
  questionNumber: number;
  timeSpentSeconds: number;
  questionText: string;
  questionType: string;
  details: QuestionDetails | null;
  explanation: string | null;
  userAnswer: AnswerType;
  isCorrect: boolean;
  correctAnswer: CorrectAnswer;
  marksAwarded: number | null;
  maxMarks: number | null;
  topic: {
    topicId: number;
    topicName: string;
  };
  subtopic: {
    subtopicId: number;
    subtopicName: string;
  } | null;
  isImageBased: boolean | null;
  imageUrl: string | null;
}

// Helper function to extract the correct answer based on question type
function getCorrectAnswer(details: QuestionDetails, questionType: string): CorrectAnswer {
  try {
    switch (questionType) {
      case 'MultipleChoice':
        // Find the correct option
        const correctOption = (details as MultipleChoiceDetails).options.find((opt: { key: string; isCorrect: boolean }) => opt.isCorrect);
        return { selectedOption: correctOption ? correctOption.key : null };
        
      case 'Matching':
        // Extract the correct matches
        const matches: Record<string, string> = {};
        (details as MatchingDetails).items.forEach((item: { key: string; matchesTo: string }) => {
          matches[item.key] = item.matchesTo;
        });
        return { matches };
        
      case 'MultipleCorrectStatements':
        // Find all correct statements
        const correctStatements = (details as MultipleCorrectStatementsDetails).statements
          .filter((statement: { key: string; isCorrect: boolean }) => statement.isCorrect)
          .map((statement: { key: string; isCorrect: boolean }) => statement.key);
        return { selectedStatements: correctStatements };
        
      case 'AssertionReason':
        // Return the correct selection
        return { selection: (details as AssertionReasonDetails).correctOption };
        
      case 'SequenceOrdering':
        // Return the correct sequence
        return { sequence: (details as SequenceOrderingDetails).correctSequence };
        
      default:
        return null;
    }
  } catch (e) {
    console.error(`Error extracting correct answer for ${questionType}:`, e);
    return null;
  }
}
