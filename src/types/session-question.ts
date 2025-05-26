// src/types/session-question.ts

export interface SessionQuestionLookupParams {
  session_id: number;
  question_id: number;
}

export interface SessionQuestionLookupResponse {
  session_question_id: number;
}

export interface SessionQuestionError {
  error: string;
  details?: Record<string, string[]>;
}