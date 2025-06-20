// src/app/practice-sessions/[sessionId]/review/components/interfaces.ts

// Session and topic performance interfaces
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

// Define the QuestionType enum type
export type QuestionType = 
  | 'MultipleChoice' 
  | 'Matching' 
  | 'MultipleCorrectStatements' 
  | 'AssertionReason' 
  | 'DiagramBased' 
  | 'SequenceOrdering';

// Base interfaces for all question types
export interface BaseOption {
  id: string;         // Unique identifier
  text: string;       // Display text
  isCorrect: boolean; // Whether this option is correct
}

export interface BaseQuestionDetails {
  options: BaseOption[];
  metadata: {
    questionType: QuestionType;
  };
}

// Type-specific extensions
// Use type instead of empty interface to avoid ESLint warning
export type MultipleChoiceDetails = BaseQuestionDetails;

export interface MatchingDetails extends BaseQuestionDetails {
  matchingColumns: {
    left: { 
      header: string; 
      items: { id: string; text: string; }[]; 
    };
    right: { 
      header: string; 
      items: { id: string; text: string; }[]; 
    };
  };
}

export interface MultipleCorrectDetails extends BaseQuestionDetails {
  statements: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  introText?: string;
}

export interface AssertionReasonDetails extends BaseQuestionDetails {
  assertion: string;
  reason: string;
}

export interface DiagramBasedDetails extends BaseQuestionDetails {
  diagramDescription?: string;
}

export interface SequenceOrderingDetails extends BaseQuestionDetails {
  introText?: string;
  correctSequence: string[];
  items?: {
    id: string;
    text: string;
  }[];
}

// Normalized answer formats
export interface BaseAnswer {
  type: QuestionType;
}

export interface MultipleChoiceAnswer extends BaseAnswer {
  type: 'MultipleChoice';
  selectedOption: string;
}

export interface MatchingAnswer extends BaseAnswer {
  type: 'Matching';
  selectedOption: string;
}

export interface MultipleCorrectAnswer extends BaseAnswer {
  type: 'MultipleCorrectStatements';
  selectedStatements: string[];
}

export interface AssertionReasonAnswer extends BaseAnswer {
  type: 'AssertionReason';
  selectedOption: string;
}

export interface DiagramBasedAnswer extends BaseAnswer {
  type: 'DiagramBased';
  selectedOption: string;
}

export interface SequenceOrderingAnswer extends BaseAnswer {
  type: 'SequenceOrdering';
  selectedOption: string;
  sequence?: string[];
}

export type NormalizedAnswer = 
  | MultipleChoiceAnswer
  | MatchingAnswer
  | MultipleCorrectAnswer
  | AssertionReasonAnswer
  | DiagramBasedAnswer
  | SequenceOrderingAnswer;

export type NormalizedQuestionDetails =
  | MultipleChoiceDetails
  | MatchingDetails
  | MultipleCorrectDetails
  | AssertionReasonDetails
  | DiagramBasedDetails
  | SequenceOrderingDetails;

// Updated QuestionAttempt interface
export interface QuestionAttempt {
  questionId: number;
  questionNumber: number;
  timeSpentSeconds: number;
  questionText: string;
  questionType: QuestionType;
  details: NormalizedQuestionDetails;
  explanation: string | null;
  userAnswer: NormalizedAnswer;
  isCorrect: boolean | null;
  correctAnswer: NormalizedAnswer;
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