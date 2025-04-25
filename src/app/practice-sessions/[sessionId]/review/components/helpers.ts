import { 
  QuestionAttempt, 
  QuestionType, 
  FlexibleAnswerType, 
  QuestionDetails,
  MultipleChoiceAnswer,
  AssertionReasonAnswer,
  //OptionFormat
} from './interfaces';

// Define a generic option/statement type
interface OptionBase {
  option_number?: string | number;
  key?: string | number;
  option_text?: string;
  text?: string;
  is_correct?: boolean;
  isCorrect?: boolean;
  statement_text?: string;
}

// Normalized option type with explicit string key
interface NormalizedOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

// Define possible formats for diagram-based options
interface DiagramOption {
  key?: string;
  text?: string;
  label?: string;
  value?: string;
  content?: string;
  [key: string]: unknown;
}

// Normalize options structure for consistency
export const normalizeOptions = (options: OptionBase[]): NormalizedOption[] => {
  if (!Array.isArray(options)) return [];
  
  return options.map(option => ({
    key: String(option.option_number || option.key || ''),
    text: option.option_text || option.text || option.statement_text || 
          (typeof option === 'string' ? option : JSON.stringify(option)),
    isCorrect: option.is_correct || option.isCorrect || false
  }));
};

// Normalize statements structure for consistency
export const normalizeStatements = (statements: OptionBase[]): NormalizedOption[] => {
  if (!Array.isArray(statements)) return [];
  
  return statements.map(statement => ({
    key: String(statement.option_number || statement.key || ''),
    text: statement.statement_text || statement.option_text || statement.text || '',
    isCorrect: statement.is_correct || statement.isCorrect || false
  }));
};

// Normalize DiagramBased options specifically
export const normalizeDiagramOptions = (rawOptions: unknown): { key: string; text: string }[] => {
  // If no options, return empty array
  if (!rawOptions) return [];
  
  // If rawOptions is already an array of objects with key and text, return it
  if (Array.isArray(rawOptions) && rawOptions.length > 0 && 
      rawOptions.every(o => typeof o === 'object' && o !== null && 'key' in o && 'text' in o)) {
    return rawOptions.map(option => ({
      key: String(option.key),
      text: String(option.text)
    }));
  }
  
  // If it's an array but has different structure, inspect first item
  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    const firstItem = rawOptions[0];
    
    // Check if items might be objects with different properties
    if (typeof firstItem === 'object' && firstItem !== null) {
      // Try to extract text from common properties
      if ('text' in firstItem || 'label' in firstItem || 'value' in firstItem || 'content' in firstItem) {
        return rawOptions.map((option, index) => {
          const typedOption = option as DiagramOption;
          return {
            key: String.fromCharCode(65 + index), // A, B, C, etc.
            text: String(
              typedOption.text || 
              typedOption.label || 
              typedOption.value || 
              typedOption.content || 
              JSON.stringify(option)
            )
          };
        });
      }
      
      // If object but no recognizable text property, stringify it
      return rawOptions.map((option, index) => ({
        key: String.fromCharCode(65 + index),
        text: JSON.stringify(option)
      }));
    }
    
    // Handle primitives (strings, numbers, etc.)
    return rawOptions.map((option, index) => ({
      key: String.fromCharCode(65 + index),
      text: String(option)
    }));
  }
  
  // Last resort - try to handle it as a single item or unknown structure
  return [];
};

// Modify the interface to make options more flexible
interface ExtendedQuestionDetails extends Omit<QuestionDetails, 'options' | 'items'> {
  options?: Array<{
    key?: string;
    text?: string;
    option_number?: string | number;
    option_text?: string;
    is_correct?: boolean;
    isCorrect?: boolean;
    matchesTo?: string;
  }>;
  items?: Array<{
    key?: string;
    text?: string;
    matchesTo?: string;
    option_number?: string | number;
    is_correct?: boolean;
    isCorrect?: boolean;
  }>;
}

// Gets the correct answer based on question type
export function getCorrectAnswer(
  details: QuestionDetails | null, 
  questionType: QuestionType
): FlexibleAnswerType | null {
  if (!details) return null;

  // Cast to extended details to access additional properties
  const extendedDetails = details as ExtendedQuestionDetails;

  try {
    switch (questionType) {
      case 'MultipleChoice': {
        const correctOption = extendedDetails.options?.find(
          (opt) => opt.is_correct === true || opt.isCorrect === true
        );
        return { 
          selection: correctOption ? 
            (correctOption.option_number?.toString() || correctOption.key?.toString() || '') : 
            '' 
        } as MultipleChoiceAnswer;
      }
      
      case 'Matching': {
        const matches: Record<string, string> = {};
        extendedDetails.items?.forEach((item) => {
          if (item.key && item.matchesTo) {
            matches[String(item.key)] = String(item.matchesTo);
          }
        });
        return matches;
      }
      
      case 'MultipleCorrectStatements': {
        const correctStatements = extendedDetails.options?.filter(
          (statement) => statement.is_correct === true || statement.isCorrect === true
        ).map((statement) => String(statement.key || statement.option_number || '')) || [];
        return correctStatements;
      }
      
      case 'AssertionReason': {
        const correctOption = extendedDetails.options?.find(
          (opt) => opt.is_correct === true || opt.isCorrect === true
        );
        return { 
          selection: correctOption ? 
            (correctOption.option_number?.toString() || correctOption.key?.toString() || '') : 
            '',
          statement1: details.statement1,
          statement2: details.statement2
        } as AssertionReasonAnswer;
      }
      
      case 'SequenceOrdering': {
        // Handle direct sequence array if available
        if (details.correctSequence && Array.isArray(details.correctSequence)) {
          return details.correctSequence.map(item => String(item));
        }
        
        // Handle sequence ordering presented as multiple choice options
        if (extendedDetails.options) {
          const correctOption = extendedDetails.options.find(
            (opt) => opt.is_correct === true || opt.isCorrect === true
          );
          
          if (correctOption) {
            // If option_text contains dashes, it's likely a sequence like "E-C-A-D-B"
            const optionText = correctOption.option_text || correctOption.text;
            if (optionText && typeof optionText === 'string' && optionText.includes('-')) {
              return parseSequenceString(optionText);
            }
            
            return { 
              selection: correctOption.option_number?.toString() || 
                         correctOption.key?.toString() || 
                         '' 
            };
          }
        }
        
        // Default empty sequence
        return [];
      }
      
      case 'DiagramBased': {
        const correctOption = extendedDetails.options?.find(
          (opt) => opt.is_correct === true || opt.isCorrect === true
        );
        
        return { 
          selectedOption: correctOption ? 
            (correctOption.option_number?.toString() || correctOption.key?.toString() || '') : 
            '' 
        };
      }
      
      default:
        return null;
    }
  } catch (e) {
    console.error(`Error extracting correct answer for ${questionType}:`, e);
    return null;
  }
}

// Parse a JSON string or return the original object if not a string
export function safeJsonParse<T>(value: string | T): T {
  if (typeof value !== 'string') return value;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    console.error('Failed to parse JSON string');
    return value as unknown as T;
  }
}

export function parseSequenceString(sequenceStr: string | undefined): string[] {
  if (!sequenceStr) return [];
  return sequenceStr.split('-');
}

// This function standardizes the format of retrieved question attempts
export const normalizeQuestionAttempt = (attempt: Record<string, unknown>): QuestionAttempt => {
  // Safely type-cast with required properties
  const normalizedAttempt = {
    questionId: attempt.questionId as number || 0,
    questionNumber: attempt.questionNumber as number || 0,
    timeSpentSeconds: attempt.timeSpentSeconds as number || 0,
    questionText: attempt.questionText as string || '',
    questionType: attempt.questionType as QuestionType || 'MultipleChoice',
    details: attempt.details as QuestionDetails | null || null,
    explanation: attempt.explanation as string | null || null,
    userAnswer: attempt.userAnswer as FlexibleAnswerType || null,
    isCorrect: attempt.isCorrect as boolean || false,
    correctAnswer: attempt.correctAnswer as FlexibleAnswerType || null,
    marksAwarded: attempt.marksAwarded as number || 0,
    maxMarks: attempt.maxMarks as number || 0,
    topic: attempt.topic as { topicId: number; topicName: string } || { topicId: 0, topicName: '' },
    subtopic: attempt.subtopic as { subtopicId: number; subtopicName: string } | undefined,
    isImageBased: attempt.isImageBased as boolean | null | undefined,
    imageUrl: attempt.imageUrl as string | null | undefined
  };

  // Handle question type-specific normalization
  if (normalizedAttempt.questionType === 'MultipleChoice') {
    // Normalize options if present
    if (normalizedAttempt.details?.options) {
      const normalizedOptions = normalizeOptions(normalizedAttempt.details.options as OptionBase[]);
      normalizedAttempt.details.options = normalizedOptions;
    }
  }
  
  return normalizedAttempt;
};