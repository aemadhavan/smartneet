// src/types/session-detail.ts

// Session detail responses
export interface SessionDetailResponse {
  session: SessionDetail;
  questions: SessionQuestionDetail[];
  source?: 'cache' | 'database';
}

export interface SessionDetail {
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
  notes?: string;
  settings?: Record<string, unknown>;
  subject_id?: number;
  subject_name?: string;
  topic_id?: number;
  topic_name?: string;
  subtopic_id?: number;
  subtopic_name?: string;
}

export interface SessionQuestionDetail {
  session_question_id: number;
  question_order: number;
  is_bookmarked: boolean;
  time_spent_seconds: number;
  question: {
    question_id: number;
    question_text: string;
    question_type: string;
    details: unknown;
    explanation: string | null;
    difficulty_level: string | null;
    marks: number | null;
    negative_marks: number | null;
    topic_id: number;
    topic_name: string | null;
    subtopic_id: number | null;
    subtopic_name: string | null;
  }
}

// Session update request
export interface UpdateSessionDetailRequest {
  questions_attempted?: number;
  questions_correct?: number;
  score?: number;
  max_score?: number;
  is_completed?: boolean;
  end_time?: Date;
  notes?: string;
  settings?: Record<string, unknown>;
  updated_at?: Date;
}