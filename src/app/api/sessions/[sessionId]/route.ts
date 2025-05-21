// src/app/api/sessions/[sessionId]/route.ts.deprecated

// DEPRECATED: This route's functionality has been merged into
// GET /api/practice-sessions/[sessionId]/route.ts (for active sessions)
// and GET /api/practice-sessions/[sessionId]/review/route.ts (for session review).
// This file is kept for reference only and is not part of the active codebase.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  practice_sessions, 
  //subjects, 
  topics, 
  subtopics,
  session_questions,
  question_attempts,
  questions
} from '@/db';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// Define type for question details based on question type
interface QuestionDetailsBase {
  questionText: string;
  options: string[];
}

interface MultipleChoiceDetails extends QuestionDetailsBase {
  correctIndex: number;
}

interface MultipleCorrectStatementsDetails extends QuestionDetailsBase {
  correctIndices: number[];
}

interface AssertionReasonDetails extends QuestionDetailsBase {
  correctOption: string;
}

interface MatchingDetails {
  items: { id: string; text: string }[];
  options: { id: string; text: string }[];
  correctMatches: Record<string, string>;
}

// Union type for all possible question details
type QuestionDetails = 
  | MultipleChoiceDetails 
  | MultipleCorrectStatementsDetails 
  | AssertionReasonDetails 
  | MatchingDetails;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = parseInt((await params).sessionId);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Get the session details with subject and topic information
    const session = await db.query.practice_sessions.findFirst({
      where: and(
        eq(practice_sessions.session_id, sessionId),
        eq(practice_sessions.user_id, userId)
      ),
      with: {
        subject: true,
        topic: true,
        subtopic: true
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Calculate session accuracy - handle possible null values
    const questionsAttempted = session.questions_attempted ?? 0;
    const questionsCorrect = session.questions_correct ?? 0;
    const accuracy = questionsAttempted > 0
      ? (questionsCorrect / questionsAttempted) * 100
      : 0;

    // Format session data for response
    const sessionData = {
      session_id: session.session_id,
      session_type: session.session_type,
      start_time: session.start_time,
      end_time: session.end_time,
      duration_minutes: session.duration_minutes,
      subject_name: session.subject?.subject_name,
      topic_name: session.topic?.topic_name,
      subtopic_name: session.subtopic?.subtopic_name,
      total_questions: session.total_questions,
      questions_attempted: questionsAttempted,
      questions_correct: questionsCorrect,
      score: session.score,
      max_score: session.max_score,
      accuracy
    };

    // Get question attempts with question details
    const questionResults = await db.select({
      // From session questions
      session_question_id: session_questions.session_question_id,
      question_id: session_questions.question_id,
      is_bookmarked: session_questions.is_bookmarked,
      time_spent_seconds: session_questions.time_spent_seconds,
      
      // From questions
      question_text: questions.question_text,
      question_type: questions.question_type,
      explanation: questions.explanation,
      details: questions.details,
      difficulty_level: questions.difficulty_level,
      marks: questions.marks,
      negative_marks: questions.negative_marks,
      
      // From topics and subtopics
      topic_id: topics.topic_id,
      topic_name: topics.topic_name,
      subtopic_name: subtopics.subtopic_name,
      
      // From question attempts
      is_correct: question_attempts.is_correct,
      user_answer: question_attempts.user_answer,
      marks_awarded: question_attempts.marks_awarded
    })
    .from(session_questions)
    .innerJoin(questions, eq(session_questions.question_id, questions.question_id))
    .innerJoin(topics, eq(questions.topic_id, topics.topic_id))
    .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
    .leftJoin(
      question_attempts, 
      and(
        eq(question_attempts.session_id, sessionId),
        eq(question_attempts.question_id, session_questions.question_id)
      )
    )
    .where(
      and(
        eq(session_questions.session_id, sessionId),
        eq(session_questions.user_id, userId)
      )
    );

    // Process question results to add correct answer data
    const processedQuestionResults = questionResults.map(q => {
      // Extract correct answer from question details
      // This is a simplified approach - in a real app, you'd need more complex logic
      // depending on question type
      let correctAnswer = null;
      
      try {
        // Type assertion for the details JSON
        const details = q.details as QuestionDetails;
        
        switch (q.question_type) {
          case 'MultipleChoice':
            // Type guard
            if ('correctIndex' in details) {
              correctAnswer = details.correctIndex;
            }
            break;
          case 'MultipleCorrectStatements':
            if ('correctIndices' in details) {
              correctAnswer = details.correctIndices;
            }
            break;
          case 'AssertionReason':
            if ('correctOption' in details) {
              correctAnswer = details.correctOption;
            }
            break;
          case 'Matching':
            if ('correctMatches' in details) {
              correctAnswer = details.correctMatches;
            }
            break;
          default:
            correctAnswer = null;
        }
      } catch (e) {
        console.error('Error extracting correct answer:', e);
      }
      
      return {
        question_id: q.question_id,
        topic_id: q.topic_id,
        question_text: q.question_text,
        question_type: q.question_type,
        topic_name: q.topic_name,
        subtopic_name: q.subtopic_name,
        is_correct: q.is_correct || false,
        time_taken_seconds: q.time_spent_seconds || 0,
        user_answer: q.user_answer,
        correct_answer: correctAnswer,
        explanation: q.explanation,
        marks_awarded: q.marks_awarded || 0,
        marks_available: q.marks,
        is_bookmarked: q.is_bookmarked
      };
    });

    return NextResponse.json({ 
      session: sessionData, 
      questions: processedQuestionResults 
    });
    
  } catch (error) {
    console.error('Error fetching session results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}