// src/app/practice-sessions/[sessionId]/review/services/questionProcessor.ts

import { QuestionAttempt, QuestionType } from '../components/interfaces';
import { normalizeQuestionDetails, normalizeUserAnswer } from '../components/normalizers';

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
  // Safely extract the question type
  const questionType = rawAttempt.questionType as QuestionType;
  
  // Safely parse details
  const parsedDetails = safeParseDetails(questionType, rawAttempt.details);
  
  // Normalize details and answers
  const normalizedDetails = normalizeQuestionDetails(
    questionType,
    parsedDetails
  );
  
  const normalizedUserAnswer = normalizeUserAnswer(
    questionType,
    rawAttempt.userAnswer
  );
  
  const normalizedCorrectAnswer = normalizeUserAnswer(
    questionType,
    rawAttempt.correctAnswer
  );
  
  // Return the normalized question attempt
  return {
    questionId: Number(rawAttempt.questionId || 0),
    questionNumber: Number(rawAttempt.questionNumber || 0),
    timeSpentSeconds: Number(rawAttempt.timeSpentSeconds || 0),
    questionText: String(rawAttempt.questionText || ''),
    questionType,
    details: normalizedDetails,
    explanation: typeof rawAttempt.explanation === 'string' ? rawAttempt.explanation : null,
    userAnswer: normalizedUserAnswer,
    isCorrect: Boolean(rawAttempt.isCorrect),
    correctAnswer: normalizedCorrectAnswer,
    marksAwarded: Number(rawAttempt.marksAwarded || 0),
    maxMarks: Number(rawAttempt.maxMarks || 0),
    topic: rawAttempt.topic as { topicId: number; topicName: string } || { topicId: 0, topicName: '' },
    subtopic: rawAttempt.subtopic as { subtopicId: number; subtopicName: string } | undefined,
    isImageBased: Boolean(rawAttempt.isImageBased),
    imageUrl: rawAttempt.imageUrl as string | null
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