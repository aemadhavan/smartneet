import { 
  QuestionAttempt, 
  QuestionType, 
  FlexibleAnswerType, 
  QuestionDetails,
  MultipleChoiceAnswer,
  AssertionReasonAnswer,
  OptionFormat
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

// Normalized option type
interface NormalizedOption {
  key: string | number;
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
    key: option.option_number || option.key || '',
    text: option.option_text || option.text || option.statement_text || 
          (typeof option === 'string' ? option : JSON.stringify(option)),
    isCorrect: option.is_correct || option.isCorrect || false
  }));
};

// Normalize statements structure for consistency
export const normalizeStatements = (statements: OptionBase[]): NormalizedOption[] => {
  if (!Array.isArray(statements)) return [];
  
  return statements.map(statement => ({
    key: statement.option_number || statement.key || '',
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
    return rawOptions as { key: string; text: string }[];
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


// Define detailed types for different question types
interface MultipleChoiceDetails {
  options: { option_number?: string | number; is_correct?: boolean }[];
}

interface MatchingDetails {
  items: { key: string; matchesTo: string }[];
}

interface MultipleCorrectStatementsDetails {
  statements: { key?: string; option_number?: string; is_correct?: boolean }[];
}

interface AssertionReasonDetails {
  correctOption: string;
}

interface SequenceOrderingDetails {
  correctSequence: string[];
}

interface DiagramBasedDetails {
  options: unknown[];
}

// Gets the correct answer based on question type
export function getCorrectAnswer(
  details: QuestionDetails | null, 
  questionType: QuestionType
): FlexibleAnswerType | null {
  if (!details) return null;

  try {
    switch (questionType) {
      case 'MultipleChoice': {
        const choiceDetails = details as unknown as MultipleChoiceDetails;
        const correctOption = choiceDetails.options?.find((opt) => opt.is_correct === true);
        return { 
          selection: correctOption ? 
            (correctOption.option_number?.toString() || '') : 
            '' 
        } as MultipleChoiceAnswer;
      }
      
      case 'Matching': {
        const matchingDetails = details as unknown as MatchingDetails;
        const matches: Record<string, string> = {};
        matchingDetails.items?.forEach((item) => {
          matches[item.key] = item.matchesTo;
        });
        return matches;
      }
      
      case 'MultipleCorrectStatements': {
        const statementsDetails = details as unknown as MultipleCorrectStatementsDetails;
        const correctStatements = statementsDetails.statements
          ?.filter((statement) => statement.is_correct === true)
          .map((statement) => statement.key || statement.option_number || '');
        return correctStatements || [];
      }
      
      case 'AssertionReason': {
        const assertionDetails = details as unknown as AssertionReasonDetails;
        return { 
          selection: assertionDetails.correctOption || '',
          statement1: details.statement1,
          statement2: details.statement2
        } as AssertionReasonAnswer;
      }
      
      case 'SequenceOrdering': {
        // Handle direct sequence array if available
        if (details.correctSequence && Array.isArray(details.correctSequence)) {
          return details.correctSequence;
        }
        
        // Handle sequence ordering presented as multiple choice options
        if (details.options && Array.isArray(details.options)) {
          const firstOption = details.options[0];
          
          // Check which format we're dealing with
          if (firstOption) {
            // Format with original properties (is_correct, option_text, option_number)
            if (typeof firstOption === 'object' && 
                ('is_correct' in firstOption || 'isCorrect' in firstOption || 
                 'option_text' in firstOption || 'option_number' in firstOption)) {
              
              // Type assertion to access these properties safely
              type OriginalOption = {
                is_correct?: boolean;
                isCorrect?: boolean;
                option_text?: string;
                option_number?: string | number;
              };
              
              // Find the correct option
              const correctOption = details.options.find((opt: any) => 
                (opt as OriginalOption).is_correct === true || (opt as OriginalOption).isCorrect === true
              ) as OriginalOption | undefined;
              
              if (correctOption && correctOption.option_text) {
                // If the option text contains dashes, it's likely a sequence like "E-C-A-D-B"
                if (typeof correctOption.option_text === 'string' && 
                    correctOption.option_text.includes('-')) {
                  return parseSequenceString(correctOption.option_text);
                }
                return { selection: correctOption.option_number?.toString() || '' };
              }
            } 
            // Format with normalized properties (key, text, isCorrect)
            else if (typeof firstOption === 'object' && 
                     'key' in firstOption && 'text' in firstOption) {
              
              // Type assertion for normalized format
              type NormalizedOption = {
                key: string | number;
                text: string;
                isCorrect?: boolean;
              };
              
              // Find the correct option
              const correctOption = details.options.find((opt: any) => 
                (opt as NormalizedOption).isCorrect === true
              ) as NormalizedOption | undefined;
              
              if (correctOption && correctOption.text) {
                // If the text contains dashes, it's likely a sequence like "E-C-A-D-B"
                if (typeof correctOption.text === 'string' && 
                    correctOption.text.includes('-')) {
                  return parseSequenceString(correctOption.text);
                }
                return { selection: correctOption.key?.toString() || '' };
              }
            }
          }
        }
        
        // Default empty sequence
        return [];
      }
      
      case 'DiagramBased': {
        const diagramDetails = details as unknown as DiagramBasedDetails;
        const options = diagramDetails.options || [];
        
        if (!Array.isArray(options)) return { selectedOption: '' };
        
        // Use type-safe approach to find the correct option
        const correctOption = options.find(opt => {
          if (typeof opt !== 'object' || opt === null) return false;
          
          // Try different property names for "is correct" flag
          const optionObj = opt as OptionFormat;
          return optionObj.is_correct === true || optionObj.isCorrect === true;
        });
        
        if (!correctOption || typeof correctOption !== 'object') return { selectedOption: '' };
        
        // Extract key using type-safe approach
        const correctOptionObj = correctOption as OptionFormat;
        const optionKey = correctOptionObj.key || 
                          correctOptionObj.option_number?.toString() || 
                          '';
        
        return { selectedOption: optionKey };
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
  } catch (e) {
    console.error('Failed to parse JSON string:', e);
    return value as unknown as T;
  }
}

export function parseSequenceString(sequenceStr: string | undefined): string[] {
  if (!sequenceStr) return [];
  return sequenceStr.split('-');
}

// This function standardizes the format of retrieved question attempts
export const normalizeQuestionAttempt = (attempt: Record<string, unknown>): QuestionAttempt => {
  if (!attempt) return {} as QuestionAttempt;
  
  // Create a deep copy to avoid mutating the original object
  const normalizedAttempt = JSON.parse(JSON.stringify(attempt));
  
  // Ensure details is an object
  if (typeof normalizedAttempt.details === 'string') {
    try {
      normalizedAttempt.details = JSON.parse(normalizedAttempt.details);
    } catch (e) {
      console.error('Failed to parse details JSON:', e);
      normalizedAttempt.details = {};
    }
  }

  // Ensure userAnswer is an object
  if (typeof normalizedAttempt.userAnswer === 'string') {
    try {
      normalizedAttempt.userAnswer = JSON.parse(normalizedAttempt.userAnswer);
    } catch (e) {
      console.error('Failed to parse userAnswer JSON:', e);
      normalizedAttempt.userAnswer = {};
    }
  }

  // Ensure correctAnswer is an object
  if (typeof normalizedAttempt.correctAnswer === 'string') {
    try {
      normalizedAttempt.correctAnswer = JSON.parse(normalizedAttempt.correctAnswer);
    } catch (e) {
      console.error('Failed to parse correctAnswer JSON:', e);
      normalizedAttempt.correctAnswer = {};
    }
  }

  // Handle question type-specific normalization
  switch (normalizedAttempt.questionType) {
    case 'MultipleChoice': {
      // Ensure options have consistent properties for rendering
      if (normalizedAttempt.details?.options) {
        const normalizedOptions = normalizeOptions(normalizedAttempt.details.options);
        normalizedAttempt.details.options = normalizedOptions;
      }
      
      // Normalize user answer - THIS IS THE CRITICAL FIX FOR USER ANSWER
      if (normalizedAttempt.userAnswer) {
        // Store the original value for option/selection
        const optionValue = 
          normalizedAttempt.userAnswer.option || 
          normalizedAttempt.userAnswer.selectedOption || 
          normalizedAttempt.userAnswer.option_number ||
          normalizedAttempt.userAnswer.selection ||
          '';
        
        // Create a new object with both option and selection properties
        normalizedAttempt.userAnswer = {
          selection: optionValue,
          option: optionValue
        };
      }
      
      // Normalize correct answer - SAME FIX FOR CORRECT ANSWER
      if (normalizedAttempt.correctAnswer) {
        // Store the original value for option/selection
        const correctOptionValue = 
          normalizedAttempt.correctAnswer.option ||
          normalizedAttempt.correctAnswer.selectedOption || 
          normalizedAttempt.correctAnswer.option_number ||
          normalizedAttempt.correctAnswer.selection ||
          '';
        
        // Create a new object with both option and selection properties
        normalizedAttempt.correctAnswer = {
          selection: correctOptionValue,
          option: correctOptionValue
        };
      }
      break;
    }
    
    case 'DiagramBased': {
      // Normalize diagram-based options - handle stringified JSON options specially
      if (normalizedAttempt.details?.options) {
        // Special handling for stringified JSON options
        if (Array.isArray(normalizedAttempt.details.options) && 
            normalizedAttempt.details.options.length > 0 &&
            typeof normalizedAttempt.details.options[0] === 'string' &&
            (normalizedAttempt.details.options[0].includes('"option_text"') || 
             normalizedAttempt.details.options[0].includes('"option_number"'))) {
          
          // Parse the JSON strings and extract key/text pairs
          normalizedAttempt.details.options = normalizedAttempt.details.options.map((option: unknown, index: number) => {
            try {
              // Parse the JSON string
              const optionObj = typeof option === 'string' ? JSON.parse(option) : {};
    
                return {
                  key: optionObj.option_number || String.fromCharCode(65 + index),
                  text: optionObj.option_text || optionObj.text || String(option)
                };
            } catch (e) {
              console.error('Error parsing option JSON:', e);
              return {
                key: String.fromCharCode(65 + index),
                text: String(option)
              };
            }
          });
        } else {
          // For non-stringified JSON, use the regular normalization
          normalizedAttempt.details.options = normalizeDiagramOptions(normalizedAttempt.details.options);
        }
      }
      
      // Ensure user answer has the expected structure - ALSO FIXED
      if (normalizedAttempt.userAnswer) {
        if (typeof normalizedAttempt.userAnswer !== 'object' || normalizedAttempt.userAnswer === null) {
          normalizedAttempt.userAnswer = { 
            selectedOption: String(normalizedAttempt.userAnswer),
            option: String(normalizedAttempt.userAnswer)
          };
        } else {
          // Get the value from any of the possible properties
          const answerValue = 
            normalizedAttempt.userAnswer.option ||
            normalizedAttempt.userAnswer.selectedOption || 
            normalizedAttempt.userAnswer.selection || '';
          
          // Ensure both properties exist
          normalizedAttempt.userAnswer = { 
            selectedOption: answerValue,
            option: answerValue,
            selection: answerValue
          };
        }
      }
      
      // Ensure correct answer has the expected structure - ALSO FIXED
      if (normalizedAttempt.correctAnswer) {
        if (typeof normalizedAttempt.correctAnswer !== 'object' || normalizedAttempt.correctAnswer === null) {
          normalizedAttempt.correctAnswer = { 
            selectedOption: String(normalizedAttempt.correctAnswer),
            option: String(normalizedAttempt.correctAnswer),
            selection: String(normalizedAttempt.correctAnswer)
          };
        } else {
          // Get the value from any of the possible properties
          const correctValue = 
            normalizedAttempt.correctAnswer.option ||
            normalizedAttempt.correctAnswer.selectedOption || 
            normalizedAttempt.correctAnswer.selection || '';
          
          // Ensure all properties exist
          normalizedAttempt.correctAnswer = { 
            selectedOption: correctValue,
            option: correctValue,
            selection: correctValue
          };
        }
      }
      break;
    }
    
    case 'SequenceOrdering': {
      // If we have sequence_items, make sure they're accessible
      if (normalizedAttempt.details?.sequence_items) {
        // Ensure they have key properties
        normalizedAttempt.details.sequence_items = 
          normalizedAttempt.details.sequence_items.map((item: any, index: number) => ({
            ...item,
            key: item.item_number || String.fromCharCode(65 + index)
          }));
      }
      
      // For multiple-choice based sequence questions
      if (normalizedAttempt.details?.options) {
        // Process each option to extract the sequence
        normalizedAttempt.details.options = normalizedAttempt.details.options.map(
          (option: any) => {
            // If option_text contains a sequence like "E-C-A-D-B"
            if (option.option_text && typeof option.option_text === 'string' && 
                option.option_text.includes('-')) {
              return {
                ...option,
                parsedSequence: parseSequenceString(option.option_text)
              };
            }
            return option;
          }
        );
      }
      
      // Normalize user answer for sequence questions
      if (normalizedAttempt.userAnswer) {
        // If user answer is a string that might be an option letter (a, b, c, d)
        if (typeof normalizedAttempt.userAnswer === 'string' && 
            normalizedAttempt.userAnswer.length === 1) {
          // Find the corresponding option
          const selectedOption = normalizedAttempt.details?.options?.find(
            (opt: any) => opt.option_number === normalizedAttempt.userAnswer
          );
          
          if (selectedOption?.option_text && typeof selectedOption.option_text === 'string' && 
              selectedOption.option_text.includes('-')) {
            normalizedAttempt.userAnswer = {
              selection: normalizedAttempt.userAnswer,
              sequence: parseSequenceString(selectedOption.option_text)
            };
          } else {
            normalizedAttempt.userAnswer = {
              selection: normalizedAttempt.userAnswer
            };
          }
        } 
        // If user answer is already an object
        else if (typeof normalizedAttempt.userAnswer === 'object') {
          // Make sure it has a sequence property if available
          const answerObj = normalizedAttempt.userAnswer as any;
          if (answerObj.selection && !answerObj.sequence) {
            const selectedOption = normalizedAttempt.details?.options?.find(
              (opt: any) => opt.option_number === answerObj.selection
            );
            
            if (selectedOption?.option_text && typeof selectedOption.option_text === 'string' && 
                selectedOption.option_text.includes('-')) {
              answerObj.sequence = parseSequenceString(selectedOption.option_text);
              normalizedAttempt.userAnswer = answerObj;
            }
          }
        }
      }
      
      // Similar normalization for correct answer
      if (normalizedAttempt.correctAnswer) {
        // If correct answer is a string that might be an option letter (a, b, c, d)
        if (typeof normalizedAttempt.correctAnswer === 'string' && 
            normalizedAttempt.correctAnswer.length === 1) {
          // Find the corresponding option
          const correctOption = normalizedAttempt.details?.options?.find(
            (opt: any) => opt.option_number === normalizedAttempt.correctAnswer
          );
          
          if (correctOption?.option_text && typeof correctOption.option_text === 'string' && 
              correctOption.option_text.includes('-')) {
            normalizedAttempt.correctAnswer = {
              selection: normalizedAttempt.correctAnswer,
              sequence: parseSequenceString(correctOption.option_text)
            };
          } else {
            normalizedAttempt.correctAnswer = {
              selection: normalizedAttempt.correctAnswer
            };
          }
        }
        // If correct answer is already an object
        else if (typeof normalizedAttempt.correctAnswer === 'object') {
          // Make sure it has a sequence property if available
          const answerObj = normalizedAttempt.correctAnswer as any;
          if (answerObj.selection && !answerObj.sequence) {
            const correctOption = normalizedAttempt.details?.options?.find(
              (opt: any) => opt.option_number === answerObj.selection
            );
            
            if (correctOption?.option_text && typeof correctOption.option_text === 'string' && 
                correctOption.option_text.includes('-')) {
              answerObj.sequence = parseSequenceString(correctOption.option_text);
              normalizedAttempt.correctAnswer = answerObj;
            }
          }
        }
      }
      break;
    }
    // Add cases for other question types as needed
  }
  
  return normalizedAttempt as QuestionAttempt;
};

