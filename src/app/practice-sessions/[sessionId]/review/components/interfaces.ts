// Updated interfaces.ts with more flexible type definitions

export type QuestionType = 
  | 'MultipleChoice' 
  | 'Matching' 
  | 'MultipleCorrectStatements' 
  | 'AssertionReason' 
  | 'DiagramBased' 
  | 'SequenceOrdering';

// More specific type for handling answer structures
export interface MultipleChoiceAnswer {
  selectedOption?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface MatchingAnswer {
  matches?: { [key: string]: string };
  [key: string]: { [key: string]: string } | string | number | boolean | undefined;
}

export interface MultipleCorrectAnswer {
  selectedStatements?: string[];
  [key: string]: string[] | string | number | boolean | undefined;
}

export interface SequenceOrderingAnswer {
  sequence?: string[];
  [key: string]: string[] | string | number | boolean | undefined;
}

export interface DiagramBasedAnswer {
  selectedOption?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface AssertionReasonAnswer {
  selection: string;
  statement1?: string;
  statement2?: string;
  [key: string]: string | number | boolean | undefined;
}

// Revised FlexibleAnswerType to accommodate both null and complex objects
export type FlexibleAnswerType = 
  | string 
  | number 
  | boolean 
  | string[] 
  | MultipleChoiceAnswer
  | MatchingAnswer
  | MultipleCorrectAnswer
  | SequenceOrderingAnswer
  | DiagramBasedAnswer
  | AssertionReasonAnswer
  | Record<string, unknown> // Replaced 'any' with 'unknown'
  | null;

export interface QuestionDetails {
  options?: Array<{ key: string; text: string }>;
  items?: Array<{ key: string; text: string }>;
  statements?: Array<{ key: string; text: string }>;
  statement1?: string;
  statement2?: string;
  [key: string]: unknown; // Replaced 'any' with 'unknown'
}

export interface QuestionAttempt {
  questionId: number;
  questionNumber: number;
  timeSpentSeconds: number;
  questionText: string;
  questionType: QuestionType;
  details: QuestionDetails | null;
  explanation: string | null;
  userAnswer: FlexibleAnswerType;
  isCorrect: boolean;
  correctAnswer: FlexibleAnswerType;
  marksAwarded: number;
  maxMarks: number;
  topic: {
    topicId: number;
    topicName: string;
  };
  subtopic?: {
    subtopicId: number;
    subtopicName: string;
  };
  isImageBased: boolean | null | undefined;
  imageUrl: string | null | undefined;
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