import { 
  QuestionAttempt, 
  QuestionType, 
  FlexibleAnswerType, 
  QuestionDetails,
  MultipleChoiceAnswer,
  AssertionReasonAnswer
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

// Normalize options structure for consistency
export const normalizeOptions = (options: OptionBase[]): NormalizedOption[] => {
  return options.map(option => ({
    key: option.option_number || option.key || '',
    text: option.option_text || option.text || option.statement_text || 
          (typeof option === 'string' ? option : JSON.stringify(option)),
    isCorrect: option.is_correct || option.isCorrect || false
  }));
};

// Normalize statements structure for consistency
export const normalizeStatements = (statements: OptionBase[]): NormalizedOption[] => {
  return statements.map(statement => ({
    key: statement.option_number || statement.key || '',
    text: statement.statement_text || statement.option_text || statement.text || '',
    isCorrect: statement.is_correct || statement.isCorrect || false
  }));
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
        const sequenceDetails = details as unknown as SequenceOrderingDetails;
        return sequenceDetails.correctSequence || [];
      }
      
      default:
        return null;
    }
  } catch (e) {
    console.error(`Error extracting correct answer for ${questionType}:`, e);
    return null;
  }
}

// This function standardizes the format of retrieved question attempts
export const normalizeQuestionAttempt = (attempt: Record<string, unknown>): QuestionAttempt => {
  // Create a deep copy to avoid mutating the original object
  const normalizedAttempt = JSON.parse(JSON.stringify(attempt));

  // Handle multiple choice questions 
  if (normalizedAttempt.questionType === 'MultipleChoice') {
    // Ensure options have consistent properties for rendering
    if (normalizedAttempt.details?.options) {
      const normalizedOptions = normalizeOptions(normalizedAttempt.details.options);
      normalizedAttempt.details.options = normalizedOptions;
    }
    
    // Normalize user answer
    if (normalizedAttempt.userAnswer) {
      normalizedAttempt.userAnswer = {
        selection: 
          normalizedAttempt.userAnswer.selectedOption || 
          normalizedAttempt.userAnswer.option_number ||
          ''
      };
    }
    
    // Normalize correct answer
    if (normalizedAttempt.correctAnswer) {
      normalizedAttempt.correctAnswer = {
        selection: 
          normalizedAttempt.correctAnswer.selectedOption || 
          normalizedAttempt.correctAnswer.option_number ||
          ''
      };
    }
  }
  
  // Add similar normalization for other question types as needed
  
  return normalizedAttempt as QuestionAttempt;
};