// src/lib/utils/answerEvaluation.ts

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

export interface SequenceOrderingDetails {
  sequence_items: Array<{
    item_text: string;
    item_number: number;
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

  // For option-based questions, 'options' array is a common pattern.
  // Other types like FillInTheBlanks might not have 'options'.
  if ('options' in typedDetails && Array.isArray(typedDetails.options)) {
    return typedDetails.options.every((opt: unknown) => {
      if (typeof opt !== 'object' || opt === null) return false;
      const typedOpt = opt as RawOptionBeforeNormalization;
      return (
        (typeof typedOpt.option_number === 'string' || typeof typedOpt.option_number === 'number') &&
        (typedOpt.option_text === undefined || typedOpt.option_text === null || typeof typedOpt.option_text === 'string') &&
        (typeof typedOpt.is_correct === 'boolean' || typeof typedOpt.is_correct === 'number')
      );
    });
  }
  // Add checks for other question types if they have distinct structures
  if ('matching_details' in typedDetails) return true; // MatchingDetails
  if ('sequence_items' in typedDetails) return true; // SequenceOrderingDetails
  if ('statements' in typedDetails) return true; // AssertionReasonDetails or MultipleCorrectStatementsDetails
  if ('correct_answers' in typedDetails) return true; // FillInTheBlanksDetails
  
  // Fallback for types that only have options (like DiagramBased or a simple MultipleChoice)
  // This condition might need refinement if more non-option-based types are added.
  return 'options' in typedDetails && Array.isArray(typedDetails.options);
}


export function parseQuestionDetails(details: unknown): QuestionDetails {
  if (isQuestionDetails(details)) {
    // Normalize options to ensure consistent structure if options exist
    if ('options' in details && Array.isArray(details.options)) {
      return {
        ...details,
        options: details.options.map((opt: RawOptionBeforeNormalization) => ({ // Explicitly type opt
          option_number: String(opt.option_number), // Ensure string
          option_text: String(opt.option_text || ''), // Ensure string, default to empty
          is_correct: Boolean(opt.is_correct) // Ensure boolean
        }))
      } as QuestionDetails; // Cast to QuestionDetails after transformation
    }
    return details; // Return as is if no options or already conforming
  }

  if (typeof details === 'string') {
    try {
      const parsedDetails = JSON.parse(details);
      if (isQuestionDetails(parsedDetails)) {
        if ('options' in parsedDetails && Array.isArray(parsedDetails.options)) {
          return {
            ...parsedDetails,
            options: parsedDetails.options.map((opt: RawOptionBeforeNormalization) => ({
              option_number: String(opt.option_number),
              option_text: String(opt.option_text || ''),
              is_correct: Boolean(opt.is_correct)
            }))
          } as QuestionDetails;
        }
        return parsedDetails;
      }
      throw new Error('Parsed details do not match expected structure after JSON parse.');
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error during JSON parsing');
      console.error('Failed to parse question details string:', error.message);
      throw new Error(`Invalid JSON format in question details: ${error.message}`);
    }
  }

  console.error('Invalid question details format:', details);
  throw new Error('Invalid question details format. Expected an object or a valid JSON string.');
}


export function normalizeUserAnswer(userAnswer: unknown): string | string[] | null {
  if (userAnswer === null || userAnswer === undefined) {
    return null;
  }
  if (typeof userAnswer === 'number') {
    return userAnswer.toString();
  }
  if (typeof userAnswer === 'string') {
    return userAnswer;
  }
  // For MultipleCorrectStatements, the answer might be an array of strings (option numbers)
  if (Array.isArray(userAnswer) && userAnswer.every(item => typeof item === 'string' || typeof item === 'number')) {
    return userAnswer.map(item => item.toString());
  }
  if (typeof userAnswer === 'object' && userAnswer !== null) {
    const answerObj = userAnswer as Record<string, unknown>;
    const optionKeys = ['option', 'selectedOption', 'selectedMatches'];
    for (const key of optionKeys) {
      const optionValue = answerObj[key];
      if (typeof optionValue === 'string' || typeof optionValue === 'number') {
        return optionValue.toString();
      }
      // Handle array for selectedMatches or similar scenarios
      if (Array.isArray(optionValue) && optionValue.every(item => typeof item === 'string' || typeof item === 'number')) {
        return optionValue.map(item => item.toString());
      }
    }
  }
  console.warn('Could not normalize user answer:', userAnswer);
  return null;
}


export function evaluateOptionBasedAnswer(
  questionType: string,
  details: QuestionDetails,
  normalizedAnswer: string | string[] // Can be string or array of strings
): boolean {
  // Ensure the details have options
  if (!('options' in details) || !Array.isArray(details.options)) {
    console.warn(`No options found for question type: ${questionType}`);
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


export function evaluateAnswer(
  questionType: string,
  details: QuestionDetails, // This should be the already parsed object from the DB
  userAnswer: unknown
): boolean {
  try {
    const normalizedAnswer = normalizeUserAnswer(userAnswer);
    if (normalizedAnswer === null) {
      console.warn('Could not normalize user answer for evaluation:', userAnswer);
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
      
      // Add cases for other types like Matching, SequenceOrdering, FillInTheBlanks
      // For example:
      // case 'Matching':
      //   // return evaluateMatchingAnswer(details as MatchingDetails, normalizedAnswer);
      //   console.warn(`Evaluation for ${questionType} not fully implemented yet.`);
      //   return false; // Placeholder
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
      // TODO: Implement for Matching, SequenceOrdering, FillInTheBlanks
      // case 'Matching':
      //   if ('matching_details' in details && details.matching_details) {
      //     // Logic to return correct matches
      //   }
      //   break;
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
