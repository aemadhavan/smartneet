// src/app/practice-sessions/[sessionId]/review/services/questionProcessor.ts

import { QuestionAttempt, QuestionType } from '../components/interfaces';
import { normalizeQuestionDetails, normalizeUserAnswer } from '../components/normalizers';

interface Topic {
  topicId: number;
  topicName: string;
}

interface Subtopic {
  subtopicId: number;
  subtopicName: string;
}

interface RawTopic {
  topic_id?: number;
  topic_name?: string;
  topicId?: number;
  topicName?: string;
}

interface RawSubtopic {
  subtopic_id?: number;
  subtopic_name?: string;
  subtopicId?: number;
  subtopicName?: string;
}

/**
 * Safely parse details based on question type
 * @param questionType Type of the question
 * @param details Raw details from the attempt
 * @returns Parsed details as a string or object, or an empty object
 */
function safeParseDetails(
  questionType: QuestionType, 
  details: unknown
): string | Record<string, unknown> {
  try {
    // If details is already an object, return it
    if (details && typeof details === 'object') {
      return details as Record<string, unknown>;
    }
    
    // If details is a string, return it
    if (typeof details === 'string') {
      return details;
    }
    
    // If details is not parseable, return an empty object
    return {};
  } catch (error) {
    console.error('Error parsing question details:', error);
    return {};
  }
}

/**
 * Process a raw question attempt into a normalized format
 * @param rawAttempt The raw question attempt data from the API
 * @returns A normalized QuestionAttempt object
 */
export function processQuestionAttempt(rawAttempt: Record<string, unknown>): QuestionAttempt {
  // Support both camelCase and snake_case for all relevant fields
  const questionType = (rawAttempt.questionType || rawAttempt.question_type) as QuestionType;
  const questionId = Number(rawAttempt.questionId || rawAttempt.question_id || 0);
  const questionNumber = Number(rawAttempt.questionNumber || rawAttempt.question_number || 0);
  const timeSpentSeconds = Number(rawAttempt.timeSpentSeconds || rawAttempt.time_spent_seconds || 0);
  const questionText = String(rawAttempt.questionText || rawAttempt.question_text || '');
  const explanation = typeof (rawAttempt.explanation || rawAttempt.explanation) === 'string' ? (rawAttempt.explanation || rawAttempt.explanation) : null;
  const isCorrect = Boolean(rawAttempt.isCorrect || rawAttempt.is_correct);
  const marksAwarded = Number(rawAttempt.marksAwarded || rawAttempt.marks_awarded || 0);
  const maxMarks = Number(rawAttempt.maxMarks || rawAttempt.marks_available || rawAttempt.max_marks || 0);
  const isImageBased = Boolean(rawAttempt.isImageBased || rawAttempt.is_image_based);
  const imageUrl = (rawAttempt.imageUrl || rawAttempt.image_url) as string | null;

  // Safely parse details
  const parsedDetails = safeParseDetails(questionType, rawAttempt.details);
  
  // Normalize details and answers
  const normalizedDetails = normalizeQuestionDetails(
    questionType,
    parsedDetails
  );
  
  const normalizedUserAnswer = normalizeUserAnswer(
    questionType,
    rawAttempt.userAnswer || rawAttempt.user_answer
  );
  
  const normalizedCorrectAnswer = normalizeUserAnswer(
    questionType,
    rawAttempt.correctAnswer || rawAttempt.correct_answer
  );
  
  // Map topic property to expected camelCase
  let topic = rawAttempt.topic as Topic;
  if (topic && (topic as RawTopic).topic_name) {
    topic = {
      topicId: (topic as RawTopic).topic_id || 0,
      topicName: (topic as RawTopic).topic_name || '',
    };
  } else if (!topic) {
    topic = { topicId: 0, topicName: '' };
  }

  // Map subtopic property to expected camelCase
  let subtopic = rawAttempt.subtopic as Subtopic | undefined;
  if (subtopic && (subtopic as RawSubtopic).subtopic_name) {
    subtopic = {
      subtopicId: (subtopic as RawSubtopic).subtopic_id || 0,
      subtopicName: (subtopic as RawSubtopic).subtopic_name || '',
    };
  }

  // Return the normalized question attempt
  return {
    questionId,
    questionNumber,
    timeSpentSeconds,
    questionText,
    questionType,
    details: normalizedDetails,
    explanation: typeof explanation === 'string' ? explanation : null,
    userAnswer: normalizedUserAnswer,
    isCorrect,
    correctAnswer: normalizedCorrectAnswer,
    marksAwarded,
    maxMarks,
    topic,
    subtopic,
    isImageBased,
    imageUrl
  };
}

/**
 * Process an array of raw question attempts
 * @param rawAttempts Array of raw question attempts
 * @returns Array of normalized question attempts
 */
export function processQuestionAttempts(rawAttempts: Record<string, unknown>[]): QuestionAttempt[] {
  if (!Array.isArray(rawAttempts)) {
    console.error('Expected an array of question attempts');
    return [];
  }
  
  return rawAttempts.map(processQuestionAttempt);
}