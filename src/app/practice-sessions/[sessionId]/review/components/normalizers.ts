// src/app/practice-sessions/[sessionId]/review/components/normalizers.ts

/**
 * Normalization functions to convert legacy question details to standardized format
 */

import {
  QuestionType,
  BaseOption,
  MultipleChoiceDetails,
  MatchingDetails,
  MultipleCorrectDetails,
  AssertionReasonDetails,
  DiagramBasedDetails,
  SequenceOrderingDetails,
  NormalizedQuestionDetails,
  NormalizedAnswer
} from './interfaces';

// Define interfaces for legacy data formats
interface LegacyOption {
  option_number?: string | number;
  key?: string | number;
  option_text?: string;
  text?: string;
  is_correct?: boolean;
  isCorrect?: boolean;
  [key: string]: unknown;
}

interface LegacyStatement {
  statement_label?: string;
  statement_number?: number;
  statement_text?: string;
  is_correct?: boolean;
  isCorrect?: boolean;
  [key: string]: unknown;
}

interface LegacySequenceItem {
  item_number?: number;
  item_label?: string;
  item_text?: string;
  [key: string]: unknown;
}

interface LegacyMatchingItem {
  left_item_label?: string;
  left_item_text?: string;
  right_item_label?: string;
  right_item_text?: string;
  [key: string]: unknown;
}

interface LegacyDetails {
  options?: LegacyOption[];
  statement_details?: {
    statements?: LegacyStatement[];
    intro_text?: string;
    [key: string]: unknown;
  };
  statements?: LegacyStatement[];
  matching_details?: {
    items?: LegacyMatchingItem[];
    left_column_header?: string;
    right_column_header?: string;
    [key: string]: unknown;
  };
  sequence_details?: {
    items?: LegacySequenceItem[];
    intro_text?: string;
    correct_sequence?: (string | number)[];
    [key: string]: unknown;
  };
  diagram_details?: {
    description?: string;
    [key: string]: unknown;
  };
  assertion_reason_details?: {
    assertion_text?: string;
    reason_text?: string;
    [key: string]: unknown;
  };
  assertion?: string;
  reason?: string;
  [key: string]: unknown;
}

// Type for answer formats
interface LegacyAnswer {
  selectedOption?: string | number;
  selection?: string | number;
  option?: string | number;
  selectedStatements?: string[];
  [key: string]: unknown;
}

// Helper to normalize options format
function normalizeOptions(options: LegacyOption[]): BaseOption[] {
  if (!Array.isArray(options)) return [];
  
  return options.map(opt => ({
    id: String(opt.option_number || opt.key || ''),
    text: String(opt.option_text || opt.text || ''),
    isCorrect: Boolean(opt.is_correct || opt.isCorrect || false)
  }));
}

// Individual normalizers for each question type
export function normalizeMultipleChoiceDetails(data: LegacyDetails): MultipleChoiceDetails {
  return {
    options: normalizeOptions(data.options || []),
    metadata: { questionType: 'MultipleChoice' }
  };
}

export function normalizeMatchingDetails(data: LegacyDetails): MatchingDetails {
  const matchingDetails = data.matching_details || {};
  const items = matchingDetails.items || [];
  
  return {
    options: normalizeOptions(data.options || []),
    matchingColumns: {
      left: {
        header: matchingDetails.left_column_header || 'Left Column',
        items: items.map((item: LegacyMatchingItem) => ({
          id: item.left_item_label || '',
          text: item.left_item_text || ''
        }))
      },
      right: {
        header: matchingDetails.right_column_header || 'Right Column',
        items: items.map((item: LegacyMatchingItem) => ({
          id: item.right_item_label || '',
          text: item.right_item_text || ''
        }))
      }
    },
    metadata: { questionType: 'Matching' }
  };
}

export function normalizeMultipleCorrectDetails(data: LegacyDetails): MultipleCorrectDetails {
  const statementDetails = data.statement_details || {};
  const statements = statementDetails.statements || [];
  
  return {
    options: normalizeOptions(data.options || []),
    statements: statements.map((stmt: LegacyStatement) => ({
      id: stmt.statement_label || String(stmt.statement_number || ''),
      text: stmt.statement_text || '',
      isCorrect: Boolean(stmt.is_correct || stmt.isCorrect || false)
    })),
    introText: statementDetails.intro_text || '',
    metadata: { questionType: 'MultipleCorrectStatements' }
  };
}

export function normalizeAssertionReasonDetails(data: LegacyDetails): AssertionReasonDetails {
  const details = data.assertion_reason_details || {};
  
  // Extract assertion and reason from the correct fields
  let assertion = '';
  let reason = '';
  
  // First try to use the dedicated fields if they exist
  if (data.assertion) {
    assertion = data.assertion;
  } else if (details.assertion_text) {
    assertion = details.assertion_text;
  }
  
  if (data.reason) {
    reason = data.reason;
  } else if (details.reason_text) {
    reason = details.reason_text;
  }

  return {
    options: normalizeOptions(data.options || []),
    assertion,
    reason,
    metadata: { questionType: 'AssertionReason' }
  };
}

export function normalizeDiagramBasedDetails(data: LegacyDetails): DiagramBasedDetails {
  const details = data.diagram_details || {};
  
  return {
    options: normalizeOptions(data.options || []),
    diagramDescription: details.description || '',
    metadata: { questionType: 'DiagramBased' }
  };
}

export function normalizeSequenceOrderingDetails(data: LegacyDetails): SequenceOrderingDetails {
  const details = data.sequence_details || {};
  const items = details.items || [];
  
  return {
    options: normalizeOptions(data.options || []),
    introText: details.intro_text || '',
    correctSequence: Array.isArray(details.correct_sequence) 
      ? details.correct_sequence.map(String) 
      : [],
    items: items.length > 0 
      ? items.map((item: LegacySequenceItem) => ({
          id: String(item.item_number || item.item_label || ''),
          text: item.item_text || ''
        }))
      : undefined,
    metadata: { questionType: 'SequenceOrdering' }
  };
}

// Main normalizer function to handle all question types
export function normalizeQuestionDetails(questionType: QuestionType, rawDetails: Record<string, unknown> | string): NormalizedQuestionDetails {
  // Handle case where details is a string (JSON)
  const details = typeof rawDetails === 'string' 
    ? JSON.parse(rawDetails) as LegacyDetails 
    : rawDetails as LegacyDetails;
  
  switch (questionType) {
    case 'MultipleChoice':
      return normalizeMultipleChoiceDetails(details);
    case 'Matching':
      return normalizeMatchingDetails(details);
    case 'MultipleCorrectStatements':
      return normalizeMultipleCorrectDetails(details);
    case 'AssertionReason':
      return normalizeAssertionReasonDetails(details);
    case 'DiagramBased':
      return normalizeDiagramBasedDetails(details);
    case 'SequenceOrdering':
      return normalizeSequenceOrderingDetails(details);
    default:
      // Default fallback
      return {
        options: normalizeOptions(details.options as LegacyOption[] || []),
        metadata: { questionType: questionType }
      } as NormalizedQuestionDetails;
  }
}

// Normalize user answers to standardized format
export function normalizeUserAnswer(questionType: QuestionType, rawAnswer: unknown): NormalizedAnswer {
  // Parse JSON string if needed
  const answer = typeof rawAnswer === 'string' && rawAnswer.startsWith('{') 
    ? JSON.parse(rawAnswer) as LegacyAnswer
    : rawAnswer as LegacyAnswer | unknown;
    
  const getSimpleSelection = (ans: unknown): string => {
    if (!ans) return '';
    
    if (typeof ans === 'string') {
      return ans;
    }
    
    if (typeof ans === 'object' && ans !== null) {
      const typedAns = ans as Record<string, unknown>;
      return String(typedAns.selectedOption || typedAns.selection || typedAns.option || '');
    }
    
    return '';
  };
  
  switch (questionType) {
    case 'MultipleChoice':
      return {
        type: 'MultipleChoice',
        selectedOption: getSimpleSelection(answer)
      };
    
    case 'Matching':
      return {
        type: 'Matching',
        selectedOption: getSimpleSelection(answer)
      };
      
    case 'MultipleCorrectStatements':
      let selectedStatements: string[] = [];
      let selectedOption: string = '';
      if (Array.isArray(answer)) {
        selectedStatements = answer.map(String);
      } else if (answer && typeof answer === 'object' && answer !== null) {
        const typedAnswer = answer as any;
        if (Array.isArray(typedAnswer.selectedStatements)) {
          selectedStatements = typedAnswer.selectedStatements.map(String);
        } else if (Array.isArray(typedAnswer.selected_statements)) {
          selectedStatements = typedAnswer.selected_statements.map(String);
        }
        if (typedAnswer.selectedOption || typedAnswer.selected_option || typedAnswer.option) {
          selectedOption = String(typedAnswer.selectedOption || typedAnswer.selected_option || typedAnswer.option);
        }
      } else if (typeof answer === 'string' || typeof answer === 'number') {
        selectedOption = String(answer);
      }
      return {
        type: 'MultipleCorrectStatements',
        selectedStatements,
        selectedOption
      };
      
    case 'AssertionReason':
      return {
        type: 'AssertionReason',
        selectedOption: getSimpleSelection(answer)
      };
      
    case 'DiagramBased':
      return {
        type: 'DiagramBased',
        selectedOption: getSimpleSelection(answer)
      };
      
    case 'SequenceOrdering':
      return {
        type: 'SequenceOrdering',
        selectedOption: getSimpleSelection(answer),
        sequence: Array.isArray(answer) ? answer.map(String) : undefined
      };
      
    default:
      return {
        type: questionType,
        selectedOption: getSimpleSelection(answer)
      } as NormalizedAnswer;
  }
}