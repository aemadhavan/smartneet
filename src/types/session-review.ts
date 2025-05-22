// src/types/session-review.ts
import { 
  NormalizedQuestionDetails, 
  QuestionType, 
  NormalizedAnswer 
} from '@/app/practice-sessions/[sessionId]/review/components/interfaces';

export interface SessionReviewResponse {
  session: SessionReviewInfo;
  questions: DetailedReviewQuestion[];
  source?: 'cache' | 'database' | 'empty_session_no_attempts';
}

export interface SessionReviewInfo {
  session_id: number;
  session_type: string;
  start_time: Date;
  end_time?: Date;
  duration_minutes?: number;
  subject_name?: string;
  topic_name?: string;
  subtopic_name?: string;
  total_questions: number;
  questions_attempted: number;
  questions_correct: number;
  accuracy: number;
  score?: number;
  max_score?: number;
}

export interface DetailedReviewQuestion {
  question_id: number;
  question_order: number;
  time_spent_seconds: number;
  is_bookmarked: boolean;
  question_text: string;
  question_type: QuestionType | string;
  details?: NormalizedQuestionDetails | null;
  explanation?: string | null;
  user_answer?: NormalizedAnswer | null;
  is_correct: boolean | null;
  correct_answer?: unknown | null;
  marks_awarded: number;
  marks_available: number;
  negative_marks: number;
  difficulty_level?: string | null;
  topic: {
    topic_id?: number | null;
    topic_name: string;
  };
  subtopic?: {
    subtopicId: number;
    subtopicName: string;
  } | null;
  is_image_based?: boolean;
  image_url?: string | null;
}

export interface SessionReviewSummary {
  total_questions: number;
  questions_attempted: number;
  questions_correct: number;
  accuracy: number;
  score?: number;
  max_score?: number;
}

export interface EmptySessionResponse {
  session: SessionReviewInfo;
  attempts: never[];
  summary: SessionReviewSummary;
  source: 'database' | 'empty_session_no_attempts';
}