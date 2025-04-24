import { QuestionAttempt } from './interfaces';

// Normalize options structure for consistency
export const normalizeOptions = (options: any[]) => {
  return options.map(option => ({
    key: option.option_number || option.key,
    text: option.option_text || option.text || 
          (typeof option === 'string' ? option : JSON.stringify(option)),
    isCorrect: option.is_correct || option.isCorrect || false
  }));
};

// Normalize statements structure for consistency
export const normalizeStatements = (statements: any[]) => {
  return statements.map(statement => ({
    key: statement.option_number || statement.key,
    text: statement.statement_text || statement.option_text || statement.text,
    isCorrect: statement.is_correct || statement.isCorrect || false
  }));
};

// Gets the correct answer based on question type
export function getCorrectAnswer(details: any, questionType: string): any {
  try {
    switch (questionType) {
      case 'MultipleChoice':
        // Find the correct option
        const correctOption = details.options.find((opt: any) => opt.is_correct === true);
        // Return the option_number as the selected option
        return { selectedOption: correctOption ? correctOption.option_number || correctOption.key : null };
        
      case 'Matching':
        // Extract the correct matches
        const matches: Record<string, string> = {};
        details.items.forEach((item: any) => {
          matches[item.key] = item.matchesTo;
        });
        return { matches };
        
      case 'MultipleCorrectStatements':
        // Find all correct statements
        const correctStatements = details.statements
          .filter((statement: any) => statement.is_correct === true)
          .map((statement: any) => statement.key || statement.option_number);
        return { selectedStatements: correctStatements };
        
      case 'AssertionReason':
        // Return the correct selection
        return { selection: details.correctOption };
        
      case 'SequenceOrdering':
        // Return the correct sequence
        return { sequence: details.correctSequence };
        
      default:
        return null;
    }
  } catch (e) {
    console.error(`Error extracting correct answer for ${questionType}:`, e);
    return null;
  }
}

// This function standardizes the format of retrieved question attempts
export const normalizeQuestionAttempt = (attempt: any): QuestionAttempt => {
  // Handle multiple choice questions correctly
  if (attempt.questionType === 'MultipleChoice') {
    // Ensure options have consistent properties for rendering
    const normalizedOptions = (attempt.details?.options || []).map((option: any) => ({
      key: option.option_number || option.key,
      text: option.option_text || option.text,
      isCorrect: option.is_correct || option.isCorrect || false
    }));
    
    if (attempt.details) {
      attempt.details.options = normalizedOptions;
    }
    
    // Ensure user answer format is consistent
    if (attempt.userAnswer) {
      // If the answer is in option_number format, convert to selectedOption
      attempt.userAnswer.selectedOption = attempt.userAnswer.selectedOption || 
                                        attempt.userAnswer.option_number;
    }
    
    // Ensure correct answer format is consistent
    if (attempt.correctAnswer) {
      // If the answer is in option_number format, convert to selectedOption
      attempt.correctAnswer.selectedOption = attempt.correctAnswer.selectedOption || 
                                            attempt.correctAnswer.option_number;
    }
  }
  
  // Similarly normalize other question types as needed
  
  return attempt as QuestionAttempt;
};