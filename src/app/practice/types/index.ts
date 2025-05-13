// File: src/app/practice/types/index.ts
export interface Subject {
    subject_id: number;
    subject_name: string;
    subject_code: string;
  }
  
  export interface Question {
    question_id: number;
    question_text: string;
    question_type: QuestionType;
    details: string | QuestionDetails;
    explanation: string;
    difficulty_level: DifficultyLevel;
    marks: number;
    negative_marks: number;
    topic_id: number;
    topic_name: string;
    subtopic_id: number | null;
    subtopic_name: string | null;
    is_image_based?: boolean; // Add this property
    image_url?: string;      // Add this property
  }
  
  export interface SessionResponse {
    sessionId: number;
    questions: Question[];
  }
  
  export type QuestionType = 
    | 'MultipleChoice'
    | 'Matching'
    | 'MultipleCorrectStatements'
    | 'AssertionReason'
    | 'SequenceOrdering'
    | 'DiagramBased';
  
  export type DifficultyLevel = 'easy' | 'medium' | 'hard';
  
  // Question details types for each question type
  export interface MultipleChoiceOption {
    option_number: string;
    option_text: string;
  }
  
  export interface MatchingItem {
    left_item_label: string;
    left_item_text: string;
    right_item_label: string;
    right_item_text: string;
  }
  
  export interface MatchingDetails {
    options: QuestionOption[];
    matching_details: {
      items: MatchingItem[];
      left_column_header?: string;
      right_column_header?: string;
    };
    [key: string]: unknown; 
  }
  
  export interface Statement {
    statement_label: string;
    statement_text: string;
  }
  
  export interface SequenceItem {
    item_number: string;
    item_text: string;
  }
  
  export interface QuestionOption {
    option_number: string;
    option_text: string;
  }
  
  // Define the possible structures for details based on question type
  export interface MultipleChoiceDetails {
    options: MultipleChoiceOption[];
    [key: string]: unknown; 
  }
  
  // Removed duplicate MatchingDetails definition here
  
  export interface AssertionReasonDetails {
    // This structure reflects what normalizeAssertionReasonDetails will produce
    // after processing either the old or new DB format.
    statements: Statement[]; 
    options: QuestionOption[];
    // The raw DB format might look different (e.g. with assertion_reason_details nested object)
    // but the component will receive the normalized version.
    [key: string]: unknown;
  }
  
  export interface MultipleCorrectStatementsDetails {
    options: QuestionOption[];
    statement_details: {
      intro_text: string;
      statements: Statement[];
    };
    [key: string]: unknown;
  }
  
export interface SequenceOrderingDetails {
  intro_text?: string; // Added to display the instruction from DB
  sequence_items: SequenceItem[];
  options: QuestionOption[];
  [key: string]: unknown;
}

// Define DiagramBased question details structure
export interface DiagramBasedDetails {
  diagram_url: string;
  labels?: DiagramLabel[];
  options: QuestionOption[];
  diagram_details?: { // Add this new field
    description?: string;
  };
  [key: string]: unknown;
}

export interface DiagramLabel {
  label_id: string;
  label_text: string;
  x_position?: number;
  y_position?: number;
}

// Union type for all question details
export type QuestionDetails =
  | MultipleChoiceDetails
  | MatchingDetails
  | AssertionReasonDetails
  | MultipleCorrectStatementsDetails
  | SequenceOrderingDetails
  | DiagramBasedDetails;
