// src/types/dashboard.ts

export interface SessionSummary {
    session_id: number;
    session_type: string;
    start_time: string;
    subject_name: string;
    topic_name: string | null;
    questions_attempted: number;
    questions_correct: number;
    score: number;
    max_score: number;
    duration_minutes: number;
    accuracy: number;
  }
  
  export interface TopicMastery {
    topic_id: number;
    topic_name: string;
    mastery_level: string;
    accuracy_percentage: number;
    questions_attempted: number;
    last_practiced: string;
  }
  
  export interface UserStats {
    totalSessions: number;
    totalQuestionsAttempted: number;
    totalCorrectAnswers: number;
    averageAccuracy: number;
    totalDurationMinutes: number;
    streakCount: number;
    masteredTopics: number;
  }
  
  export interface RecommendationArea {
    name: string;
    accuracy: number;
  }