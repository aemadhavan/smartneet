// File: src/types/dashboard.ts

// Session data types
export interface SessionSummary {
  session_id: number;
  session_type: string;
  start_time: string;
  end_time: string | null;
  subject_name: string;
  topic_name: string | null;
  questions_attempted: number;
  questions_correct: number;
  score: number | null;
  max_score: number | null;
  duration_minutes: number | null;
  is_completed: boolean;
  accuracy: number;
}

// Topic mastery types
export interface TopicMastery {
  mastery_id: number;
  user_id: string;
  topic_id: number;
  topic_name: string;
  mastery_level: string;
  questions_attempted: number;
  questions_correct: number;
  accuracy_percentage: number;
  last_practiced: string;
  streak_count: number;
  subject_id: number;
}

// User stats types
export interface UserStats {
  totalSessions: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  averageAccuracy: number;
  totalDurationMinutes: number;
  streakCount: number;
  masteredTopics: number;
}

// Question type data
export interface QuestionTypeData {
  name: string;
  value: number;
}

// Subject performance data
export interface SubjectPerformance {
  subject: string;
  accuracy: number;
}

// Performance over time data
export interface PerformanceOverTime {
  date: string;
  accuracy: number;
  score: number;
}

// Focus/Strong areas data
export interface AreaData {
  name: string;
  accuracy: number;
}

// Dashboard data structure
export interface DashboardData {
  recentSessions: SessionSummary[];
  topicMastery: TopicMastery[];
  stats: UserStats;
  questionTypeData: QuestionTypeData[];
  subjectPerformance: SubjectPerformance[];
  performanceOverTime: PerformanceOverTime[];
  focusAreas: AreaData[];
  strongAreas: AreaData[];
}