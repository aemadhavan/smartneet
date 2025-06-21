// src/types/answer-submission.ts
import { AnswerResult, QuestionDetails } from '@/lib/utils/answerEvaluation';

export interface SubmitAnswersBody {
  answers: Record<string, string | { [key: string]: string }>; // questionId -> answer (string or object)
  timingData?: {
    totalSeconds?: number;
    questionTimes?: Record<string, number>;
    averageTimePerQuestion?: number;
  };
}

export interface QuestionDetailsWithSessionInfo {
  session_question_id: number;
  details: QuestionDetails; // Using the proper QuestionDetails type
  marks: number | null;
  negative_marks: number | null;
  question_type: string;
  topic_id?: number | null;
}

export interface SubmitAnswersResponse {
  success: boolean;
  session_id: number;
  total_answers: number;
  total_correct: number;
  accuracy: number;
  score: number;
  max_score: number;
  results: AnswerResult[];
  evaluation_summary?: Record<string, {
    questionType: string;
    userAnswer: unknown;
    correctAnswer: unknown;
    isCorrect: boolean;
  }>;
}