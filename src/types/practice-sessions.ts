// src/types/practice-sessions.ts

// Session creation request
export interface CreateSessionRequest {
  subject_id: number;
  topic_id?: number;
  subtopic_id?: number;
  session_type: 'Practice' | 'Test' | 'Review' | 'Custom';
  duration_minutes?: number;
  question_count?: number;
}

// Session update request
export interface UpdateSessionRequest {
  sessionId: number;
  isCompleted?: boolean;
  questionsAttempted?: number;
  questionsCorrect?: number;
  score?: number;
}

// Session response with pagination
export interface PaginatedSessionsResponse {
  sessions: SessionResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  source?: 'cache' | 'database' | 'stale_cache';
}

// Individual session response
export interface SessionResponse {
  session_id: number;
  session_type: string;
  start_time: Date;
  end_time?: Date;
  duration_minutes?: number;
  total_questions: number;
  questions_attempted: number;
  questions_correct: number;
  score?: number;
  max_score?: number;
  is_completed: boolean;
  subject_name: string;
  topic_name?: string;
}

// Session questions for insertion
export interface SessionQuestionInsert {
  session_id: number;
  question_id: number;
  question_order: number;
  is_bookmarked: boolean;
  time_spent_seconds: number;
  user_id: string;
  topic_id: number;
}