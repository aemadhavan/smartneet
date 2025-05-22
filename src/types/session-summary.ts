// src/types/session-summary.ts

export interface TopicPerformance {
  topicId: number;
  topicName: string;
  questionsCorrect: number;
  questionsTotal: number;
  accuracy: number;
}

export interface CalculatedMetrics {
  questionsCorrect: number;
  score: number;
  maxScore: number;
  totalTimeSeconds: number;
}

export interface SessionSummaryResponse {
  sessionId: number;
  totalQuestions: number;
  questionsAttempted: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  accuracy: number;
  calculatedAccuracy: number;
  timeTakenMinutes: number;
  score: number;
  maxScore: number;
  topicPerformance: TopicPerformance[];
  source?: 'cache' | 'database';
}

export interface SessionQuestionData {
  questionId: number;
  topicId: number;
  topicName: string;
  isCorrect: boolean | null;
  marksAwarded: number | null;
  marksPossible: number | null;
  timeTaken: number | null;
}