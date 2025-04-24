export type QuestionType = 
  | 'MultipleChoice' 
  | 'Matching' 
  | 'MultipleCorrectStatements' 
  | 'AssertionReason' 
  | 'DiagramBased' 
  | 'SequenceOrdering';

// More specific type for handling answer structures
export interface MultipleChoiceAnswer {
  selection: string;
}

export interface AssertionReasonAnswer {
  selection: string;
  statement1?: string;
  statement2?: string;
}

export type FlexibleAnswerType = 
  | string 
  | number 
  | boolean 
  | string[] 
  | MultipleChoiceAnswer
  | AssertionReasonAnswer
  | Record<string, string | number | boolean>;

export interface QuestionDetails {
  [key: string]: string | number | boolean | undefined;
  statement1?: string;
  statement2?: string;
}

export interface QuestionAttempt {
  questionId: number;
  questionNumber: number;
  timeSpentSeconds: number;
  questionText: string;
  questionType: QuestionType;
  details: QuestionDetails | null;
  explanation: string;
  userAnswer: FlexibleAnswerType | null;
  isCorrect: boolean;
  correctAnswer: FlexibleAnswerType | null;
  marksAwarded: number;
  topic: {
    topicId: number;
    topicName: string;
  };
  subtopic?: {
    subtopicId: number;
    subtopicName: string;
  };
  isImageBased: boolean;
  imageUrl?: string;
}

export interface TopicPerformance {
  topicId: number;
  topicName: string;
  questionsCorrect: number;
  questionsTotal: number;
  accuracy: number;
}

export interface SessionSummary {
  sessionId: number;
  totalQuestions: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  accuracy: number;
  timeTakenMinutes: number;
  score: number;
  maxScore: number;
  topicPerformance: TopicPerformance[];
}