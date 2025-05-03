// src/app/admin/biology/questions/components/question-types/TypeInterfaces.tsx

// Multiple Choice Question Types
export interface Option {
    option_number: string;
    option_text: string;
    is_correct: boolean;
  }
  
  // Multiple Correct Statements Types
  export interface Statement {
    statement_label: string;
    statement_text: string;
    is_correct: boolean;
  }
  
  // Assertion Reason Types
  export interface AssertionReason {
    assertion_text: string;
    reason_text: string;
    correct_option: string;
  }
  
  // Matching Question Types
  export interface MatchingItem {
    left_item_label: string;
    left_item_text: string;
    right_item_label: string;
    right_item_text: string;
  }
  
  export interface MatchingHeaders {
    left_column_header: string;
    right_column_header: string;
  }
  
  // Sequence Ordering Types
  export interface SequenceItem {
    item_number: number;
    item_label: string;
    item_text: string;
  }
  
  export interface SequenceInfo {
    intro_text: string;
    correct_sequence: string;
  }