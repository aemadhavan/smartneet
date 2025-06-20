// src/lib/utils/answerEvaluation.ts

// Question details cache to avoid repeated JSON parsing
const questionDetailsCache = new Map<string, QuestionDetails>();
const CACHE_MAX_SIZE = 1000; // Limit cache size to prevent memory issues

// Cache management functions
export function clearQuestionDetailsCache(): void {
  questionDetailsCache.clear();
}

export function getQuestionDetailsCacheSize(): number {
  return questionDetailsCache.size;
}

// TypeScript Interfaces for Question Details
// These are based on the structure observed in the `questions.details` column
// and how they are processed in the `submit` route.

export interface MultipleChoiceDetails {
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

export interface MatchingDetails {
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
  matching_details: {
    items: Array<{
      left_item_text: string;
      left_item_label: string;
      right_item_text: string;
      right_item_label: string;
    }>;
    left_column_header?: string;
    right_column_header?: string;
  };
}

export interface SequenceOrderingDetails {
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
  sequence_items?: Array<{
    item_number: string;
    item_text: string;
  }>;
  intro_text?: string;
}

export interface AssertionReasonDetails {
  statements: Array<{
    is_correct: boolean;
    statement_text: string;
    statement_label: string;
  }>;
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

export interface DiagramBasedDetails {
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

export interface MultipleCorrectStatementsDetails {
  statements: Array<{
    is_correct: boolean;
    statement_text: string;
    statement_label: string;
  }>;
  options: Array<{
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}

// TrueFalseDetails might be a specific case of MultipleChoiceDetails
export interface TrueFalseDetails {
  options: Array<{
    is_correct: boolean;
    option_text: string; // "True" or "False"
    option_number: string; // e.g., "1" for True, "2" for False
  }>;
}

// FillInTheBlanksDetails - structure depends on how answers are stored and evaluated
export interface FillInTheBlanksDetails {
  // Example: might have a single correct answer or multiple blanks
  correct_answers: string[]; // Or a more complex structure if multiple blanks
  options?: Array<{ // Unlikely for FITB, but included for completeness if it's option-based
    is_correct: boolean;
    option_text: string;
    option_number: string;
  }>;
}


export type QuestionDetails =
  | MultipleChoiceDetails
  | MatchingDetails
  | AssertionReasonDetails
  | SequenceOrderingDetails
  | DiagramBasedDetails
  | MultipleCorrectStatementsDetails
  | TrueFalseDetails // Added for completeness
  | FillInTheBlanksDetails; // Added for completeness


// Interface for individual result objects (not strictly for evaluation but often related)
export interface AnswerResult {
  question_id: number;
  is_correct: boolean;
  marks_awarded: number;
}

// Interface for the raw shape of an option before validation and normalization
export interface RawOptionBeforeNormalization {
  option_number: unknown;
  option_text?: unknown;
  is_correct: unknown;
  [key: string]: unknown;
}

export interface ParsedOptionDetails {
  option_number: string;
  option_text: string;
  is_correct: boolean;
}


// Helper function to check if the provided details object conforms to QuestionDetails
export function isQuestionDetails(details: unknown): details is QuestionDetails {
  if (typeof details !== 'object' || details === null) {
    return false;
  }

  const typedDetails = details as Partial<QuestionDetails>;

  // Fast checks for distinct question types first (most efficient)
  if ('matching_details' in typedDetails) return true; // MatchingDetails
  if ('sequence_items' in typedDetails) return true; // SequenceOrderingDetails  
  if ('statements' in typedDetails) return true; // AssertionReasonDetails or MultipleCorrectStatementsDetails
  if ('correct_answers' in typedDetails) return true; // FillInTheBlanksDetails

  // Check options-based questions (most common case)
  if ('options' in typedDetails && Array.isArray(typedDetails.options)) {
    // For performance, only validate first few options instead of all
    const optionsToCheck = typedDetails.options.slice(0, Math.min(3, typedDetails.options.length));
    return optionsToCheck.every((opt: unknown) => {
      if (typeof opt !== 'object' || opt === null) return false;
      const typedOpt = opt as RawOptionBeforeNormalization;
      return (
        (typeof typedOpt.option_number === 'string' || typeof typedOpt.option_number === 'number') &&
        (typedOpt.option_text === undefined || typedOpt.option_text === null || typeof typedOpt.option_text === 'string') &&
        (typeof typedOpt.is_correct === 'boolean' || typeof typedOpt.is_correct === 'number')
      );
    });
  }

  return false;
}


export function parseQuestionDetails(details: unknown): QuestionDetails {
  // Generate cache key for string details
  const cacheKey = typeof details === 'string' ? details : null;
  
  // Check cache first for string details (most common case)
  if (cacheKey && questionDetailsCache.has(cacheKey)) {
    return questionDetailsCache.get(cacheKey)!;
  }

  let result: QuestionDetails;

  if (isQuestionDetails(details)) {
    // Fast path: already parsed object
    if ('options' in details && Array.isArray(details.options)) {
      result = {
        ...details,
        options: details.options.map((opt: RawOptionBeforeNormalization) => ({
          option_number: String(opt.option_number),
          option_text: String(opt.option_text || ''),
          is_correct: Boolean(opt.is_correct)
        }))
      } as QuestionDetails;
    } else {
      result = details;
    }
  } else if (typeof details === 'string') {
    // Parse JSON string and cache result
    try {
      const parsedDetails = JSON.parse(details);
      if (isQuestionDetails(parsedDetails)) {
        if ('options' in parsedDetails && Array.isArray(parsedDetails.options)) {
          result = {
            ...parsedDetails,
            options: parsedDetails.options.map((opt: RawOptionBeforeNormalization) => ({
              option_number: String(opt.option_number),
              option_text: String(opt.option_text || ''),
              is_correct: Boolean(opt.is_correct)
            }))
          } as QuestionDetails;
        } else {
          result = parsedDetails;
        }
      } else {
        throw new Error('Parsed details do not match expected structure after JSON parse.');
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during JSON parsing');
      console.error('Failed to parse question details string:', error.message);
      throw new Error(`Invalid JSON format in question details: ${error.message}`);
    }
  } else {
    console.error('Invalid question details format:', details);
    throw new Error('Invalid question details format. Expected an object or a valid JSON string.');
  }

  // Cache the result if it came from a string
  if (cacheKey) {
    // Implement LRU-like behavior: if cache is full, remove oldest entry
    if (questionDetailsCache.size >= CACHE_MAX_SIZE) {
      const firstKey = questionDetailsCache.keys().next().value;
      if (firstKey !== undefined) {
        questionDetailsCache.delete(firstKey);
      }
    }
    questionDetailsCache.set(cacheKey, result);
  }

  return result;
}


export function normalizeUserAnswer(userAnswer: unknown): string | string[] | null {
  // Fast null/undefined check
  if (userAnswer == null) {
    return null;
  }

  // Fast type checks - most common cases first
  const answerType = typeof userAnswer;
  
  if (answerType === 'string') {
    return userAnswer as string;
  }
  
  if (answerType === 'number') {
    return (userAnswer as number).toString();
  }
  
  // Array check for MultipleCorrectStatements
  if (Array.isArray(userAnswer)) {
    // Optimized array validation - check type of first element and assume rest are same type
    if (userAnswer.length === 0) return [];
    
    const firstType = typeof userAnswer[0];
    if (firstType === 'string' || firstType === 'number') {
      // Quick check: if first element is valid type, assume rest are too for performance
      return userAnswer.map(item => String(item));
    }
    return null;
  }
  
  // Object check - only if it's an object and not an array
  if (answerType === 'object') {
    const answerObj = userAnswer as Record<string, unknown>;
    
    // Check most common keys first
    const optionValue = answerObj.option || answerObj.selectedOption || answerObj.selectedMatches;
    
    if (optionValue != null) {
      const optionType = typeof optionValue;
      if (optionType === 'string' || optionType === 'number') {
        return String(optionValue);
      }
      
      // Handle array values
      if (Array.isArray(optionValue) && optionValue.length > 0) {
        const firstItemType = typeof optionValue[0];
        if (firstItemType === 'string' || firstItemType === 'number') {
          return optionValue.map(item => String(item));
        }
      }
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('Could not normalize user answer:', userAnswer);
  }
  return null;
}


export function evaluateOptionBasedAnswer(
  questionType: string,
  details: QuestionDetails,
  normalizedAnswer: string | string[] // Can be string or array of strings
): boolean {
  // Ensure the details have options
  if (!('options' in details) || !Array.isArray(details.options)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`No options found for question type: ${questionType}`);
    }
    return false;
  }
  
  const options = details.options as ParsedOptionDetails[];

  if (questionType === 'MultipleCorrectStatements') {
    if (!Array.isArray(normalizedAnswer)) return false; // Expected array for this type
    const correctOptions = options.filter(opt => opt.is_correct).map(opt => opt.option_number.toString());
    if (correctOptions.length !== normalizedAnswer.length) return false; // Must select all correct and no incorrect
    return normalizedAnswer.every(ans => correctOptions.includes(ans)) && correctOptions.every(co => normalizedAnswer.includes(co));
  }

  // For single-answer option-based questions
  if (typeof normalizedAnswer === 'string') {
    return options.some(
      opt => opt.is_correct && opt.option_number.toString() === normalizedAnswer
    );
  }
  
  return false; // Fallback if normalizedAnswer type is not handled
}

/**
 * Evaluate answer for Matching question type
 * Matching questions use standard options (A, B, C, D) where one option represents the correct matching
 */
function evaluateMatchingAnswer(
  details: MatchingDetails,
  normalizedAnswer: string | string[] | null
): boolean {
  try {
    // For matching questions, the user selects one of the multiple choice options (A, B, C, D)
    // that represents the correct matching pattern
    if (!normalizedAnswer || typeof normalizedAnswer !== 'string') {
      return false;
    }

    // Check if options exist
    if (!details.options || !Array.isArray(details.options)) {
      console.warn('Matching question missing options array');
      return false;
    }

    // Find the correct option (just like multiple choice)
    const correctOption = details.options.find(opt => opt.is_correct);
    if (!correctOption) {
      console.warn('Matching question has no correct option marked');
      return false;
    }

    // Compare user's selected option with the correct option
    const isCorrect = correctOption.option_number.toString() === normalizedAnswer;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] Matching evaluation:`, {
        userAnswer: normalizedAnswer,
        correctOption: correctOption.option_number.toString(),
        isCorrect
      });
    }

    return isCorrect;
  } catch (error) {
    console.error('Error evaluating Matching answer:', error);
    return false;
  }
}

/**
 * Evaluate answer for SequenceOrdering question type
 * SequenceOrdering questions use standard options (A, B, C, D) where one option represents the correct sequence
 */
function evaluateSequenceOrderingAnswer(
  details: SequenceOrderingDetails,
  normalizedAnswer: string | string[] | null
): boolean {
  try {
    // For sequence ordering questions, the user selects one of the multiple choice options (A, B, C, D)
    // that represents the correct sequence order
    if (!normalizedAnswer || typeof normalizedAnswer !== 'string') {
      return false;
    }

    // Check if options exist
    if (!details.options || !Array.isArray(details.options)) {
      console.warn('SequenceOrdering question missing options array');
      return false;
    }

    // Find the correct option (just like multiple choice)
    const correctOption = details.options.find(opt => opt.is_correct);
    if (!correctOption) {
      console.warn('SequenceOrdering question has no correct option marked');
      return false;
    }

    // Compare user's selected option with the correct option
    const isCorrect = correctOption.option_number.toString() === normalizedAnswer;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] SequenceOrdering evaluation:`, {
        userAnswer: normalizedAnswer,
        correctOption: correctOption.option_number.toString(),
        correctSequence: correctOption.option_text,
        isCorrect
      });
    }

    return isCorrect;
  } catch (error) {
    console.error('Error evaluating SequenceOrdering answer:', error);
    return false;
  }
}

export function evaluateAnswer(
  questionType: string,
  details: QuestionDetails, // This should be the already parsed object from the DB
  userAnswer: unknown
): boolean {
  try {
    const normalizedAnswer = normalizeUserAnswer(userAnswer);
    if (normalizedAnswer === null) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not normalize user answer for evaluation:', userAnswer);
      }
      return false;
    }

    // console.log(`Evaluating ${questionType}:`, {
    //   normalizedAnswer,
    //   details: JSON.stringify(details).substring(0, 200) + '...'
    // });

    // Specific logic for different question types
    // For now, focusing on option-based as per the original structure
    // TODO: Add specific evaluation logic for Matching, SequenceOrdering, FillInTheBlanks etc.
    switch (questionType) {
      case 'MultipleChoice':
      case 'TrueFalse': // TrueFalse is essentially MultipleChoice with 2 options
      case 'DiagramBased': // Assuming these are primarily option-based
      case 'AssertionReason': // AssertionReason options are evaluated like MCQs
        if (typeof normalizedAnswer === 'string') {
          return evaluateOptionBasedAnswer(questionType, details, normalizedAnswer);
        }
        return false;
      case 'MultipleCorrectStatements':
         // evaluateOptionBasedAnswer handles array for MultipleCorrectStatements
        return evaluateOptionBasedAnswer(questionType, details, normalizedAnswer);
      
      case 'Matching':
        return evaluateMatchingAnswer(details as MatchingDetails, normalizedAnswer);
      
      case 'SequenceOrdering':
        return evaluateSequenceOrderingAnswer(details as SequenceOrderingDetails, normalizedAnswer);
      
      // Add cases for other types like FillInTheBlanks
      default:
        console.warn(`Unknown or unsupported question type for evaluation: ${questionType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error evaluating answer for question type ${questionType}:`, error);
    // console.error('Question details:', JSON.stringify(details, null, 2));
    // console.error('User answer:', JSON.stringify(userAnswer, null, 2));
    return false;
  }
}

// Function to extract correct answer for logging/debugging or for review purposes
export function getCorrectAnswerForQuestionType(
  questionType: string,
  details: QuestionDetails // This should be the already parsed object
): string | string[] | Record<string, string> | null {
  try {
    switch (questionType) {
      case 'MultipleChoice':
      case 'TrueFalse':
      case 'DiagramBased':
      case 'AssertionReason':
        if ('options' in details && Array.isArray(details.options)) {
          const correctOption = (details.options as ParsedOptionDetails[]).find(opt => opt.is_correct);
          return correctOption ? correctOption.option_number.toString() : null;
        }
        break;
      case 'MultipleCorrectStatements':
        if ('options' in details && Array.isArray(details.options)) {
          return (details.options as ParsedOptionDetails[]).filter(opt => opt.is_correct).map(opt => opt.option_number.toString());
        }
        break;
      case 'Matching':
        if ('options' in details && Array.isArray(details.options)) {
          const correctOption = (details.options as ParsedOptionDetails[]).find(opt => opt.is_correct);
          return correctOption ? correctOption.option_number.toString() : null;
        }
        break;
      case 'SequenceOrdering':
        if ('options' in details && Array.isArray(details.options)) {
          const correctOption = (details.options as ParsedOptionDetails[]).find(opt => opt.is_correct);
          return correctOption ? correctOption.option_number.toString() : null;
        }
        break;
      // TODO: Implement for FillInTheBlanks
      default:
        console.warn(`Correct answer retrieval for ${questionType} not fully implemented.`);
        return null;
    }
    return null;
  } catch (error) {
    console.error('Error extracting correct answer:', error);
    return 'Error extracting correct answer';
  }
}
