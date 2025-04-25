import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Create more specific types to avoid using 'any'
interface AssertionReasonAnswer {
  selection?: string;
  option?: string;
  selectedOption?: string;
  [key: string]: unknown;
}

// Define interfaces for option and statement objects
interface QuestionOption {
  is_correct?: boolean;
  isCorrect?: boolean;
  option_text?: string;
  option_number?: string;
  key?: string;
  text?: string;
  [key: string]: unknown;
}

interface QuestionStatement {
  statement_label?: string;
  statement_text?: string;
  is_correct?: boolean;
  isCorrect?: boolean;
  [key: string]: unknown;
}

// Define a more flexible QuestionAttempt interface
interface QuestionAttempt {
  questionText?: string;
  details?: {
    statement1?: string;
    statement2?: string;
    options?: Array<QuestionOption>;
    statements?: Array<QuestionStatement>;
    [key: string]: unknown;
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: AssertionReasonAnswer | string | null;
  correctAnswer?: AssertionReasonAnswer | string | null;
}

interface AssertionReasonProps {
  attempt: QuestionAttempt;
}

// Improved helper function to extract selection from various formats
function extractSelection(answer: unknown): string {
  if (!answer) return '';
  
  // If answer is a string
  if (typeof answer === 'string') {
    // If it looks like JSON, try to parse it
    if (answer.startsWith('{') && (answer.includes('"selection"') || answer.includes('"option"') || answer.includes('"selectedOption"'))) {
      try {
        const parsed = JSON.parse(answer);
        // Check all possible property names
        return typeof parsed.selection === 'string' ? parsed.selection : 
               typeof parsed.option === 'string' ? parsed.option :
               typeof parsed.selectedOption === 'string' ? parsed.selectedOption : '';
      } catch (e) {
        // Not valid JSON, return the string itself if it's a single character
        if (answer.length === 1) return answer;
        return '';
      }
    }
    // If it's a single character, it might be a direct selection
    if (answer.length === 1) return answer;
  }
  
  // If answer is an object with any of the possible properties
  if (typeof answer === 'object' && answer !== null) {
    // Check all possible property names in order of preference
    if ('selection' in answer) {
      const selection = (answer as AssertionReasonAnswer).selection;
      return typeof selection === 'string' ? selection : '';
    }
    
    if ('option' in answer) {
      const option = (answer as AssertionReasonAnswer).option;
      return typeof option === 'string' ? option : '';
    }
    
    if ('selectedOption' in answer) {
      const selectedOption = (answer as AssertionReasonAnswer).selectedOption;
      return typeof selectedOption === 'string' ? selectedOption : '';
    }
  }
  
  return '';
}

// Function to determine the correct answer from details if not explicitly provided
function findCorrectAnswer(details: QuestionAttempt['details']): string {
  if (!details) return '';
  
  // Try to find correct option from the options array
  if (details.options && Array.isArray(details.options)) {
    const correctOption = details.options.find((opt: QuestionOption) => 
      opt.is_correct === true || opt.isCorrect === true
    );
    if (correctOption) {
      return correctOption.option_number || correctOption.key || '';
    }
  }
  
  // If there are statement elements in the JSON, try reasoning
  // This is for questions like "A and R" type questions
  if (details.statements && Array.isArray(details.statements)) {
    // In many assertion reason formats, option A means both statements are true and R explains A
    // This is a heuristic based on common patterns
    const statementA = details.statements.find((s: QuestionStatement) => 
      s.statement_label === 'A' || s.statement_label === 'a'
    );
    const statementR = details.statements.find((s: QuestionStatement) => 
      s.statement_label === 'R' || s.statement_label === 'r'
    );
    
    if (statementA?.is_correct === true && statementR?.is_correct === true) {
      // If both statements are true, likely the first option (A) is correct
      // This is a common pattern in assertion-reason questions
      return 'a';
    }
  }
  
  return '';
}

export default function AssertionReason({ attempt }: AssertionReasonProps) {
  let userAnswer = extractSelection(attempt?.userAnswer)?.toLowerCase();
  
  // First try to get the correct answer from the correctAnswer property
  let correctAnswer = extractSelection(attempt?.correctAnswer)?.toLowerCase();
  
  // If no correct answer was found, try to determine it from the details
  if (!correctAnswer && attempt?.details) {
    correctAnswer = findCorrectAnswer(attempt.details)?.toLowerCase();
  }
  
  console.log('Raw user answer:', attempt?.userAnswer);
  console.log('Extracted user answer:', userAnswer);
  console.log('Raw correct answer:', attempt?.correctAnswer);
  console.log('Extracted/calculated correct answer:', correctAnswer);
  console.log('Question details:', attempt?.details);

  // Get statements from the question text or details
  let statement1 = '';
  let statement2 = '';
  
  // Try to get statements from details.statements array (common format)
  if (attempt?.details?.statements && Array.isArray(attempt.details.statements)) {
    const statementA = attempt.details.statements.find((s: QuestionStatement) => 
      s.statement_label === 'A' || s.statement_label === 'a'
    );
    
    const statementR = attempt.details.statements.find((s: QuestionStatement) => 
      s.statement_label === 'R' || s.statement_label === 'r'
    );
    
    if (statementA) {
      statement1 = statementA.statement_text || '';
    }
    
    if (statementR) {
      statement2 = statementR.statement_text || '';
    }
  }
  
  // Fallback to standard statement fields
  if (!statement1) {
    statement1 = attempt?.details?.statement1 || '';
  }
  
  if (!statement2) {
    statement2 = attempt?.details?.statement2 || '';
  }
  
  // Try to extract statements from question text if they're not in the details
  if (!statement1 && !statement2 && attempt?.questionText) {
    const text = attempt.questionText;
    
    // Look for patterns like "Statement A: ..." and "Statement R: ..."
    const aMatch = text.match(/Assertion\s+A:?\s*([^.]+)/i) || 
                  text.match(/Statement\s+I:?\s*([^.]+)/i) ||
                  text.match(/Statement\s+A:?\s*([^.]+)/i);
    
    const rMatch = text.match(/Reason\s+R:?\s*([^.]+)/i) || 
                  text.match(/Statement\s+II:?\s*([^.]+)/i) ||
                  text.match(/Statement\s+R:?\s*([^.]+)/i);
    
    if (aMatch && aMatch[1]) {
      statement1 = aMatch[1].trim();
    }
    
    if (rMatch && rMatch[1]) {
      statement2 = rMatch[1].trim();
    }
  }

  // Standardized options for assertion-reason questions
  const options = [
    {
      key: 'A',
      text: 'Statement I is True, Statement II is True, Statement II is a correct explanation of Statement I',
    },
    {
      key: 'B',
      text: 'Statement I is True, Statement II is True, Statement II is NOT a correct explanation of Statement I',
    },
    { key: 'C', text: 'Statement I is True, Statement II is False' },
    { key: 'D', text: 'Statement I is False, Statement II is True' },
    { key: 'E', text: 'Statement I is False, Statement II is False' },
  ];

  // If we have custom options in the details, use those instead
  if (attempt?.details?.options && Array.isArray(attempt.details.options)) {
    const customOptions = attempt.details.options.map((opt: QuestionOption, index: number) => ({
      key: opt.option_number || opt.key || String.fromCharCode(65 + index),
      text: opt.option_text || opt.text || `Option ${String.fromCharCode(65 + index)}`
    }));
    
    // Only use custom options if we actually found some
    if (customOptions.length > 0) {
      // options = customOptions;
    }
  }

  // Render nothing if no attempt data
  if (!attempt) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {attempt.questionText ?? 'No question text available'}
      </div>

      {attempt.isImageBased && attempt.imageUrl && (
        <div className="my-4">
          <Image
            src={attempt.imageUrl}
            alt="Question diagram"
            className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            width={500}
            height={300}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      )}

      <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        {statement1 && (
          <div className="mb-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Statement I:</span>
            <p className="text-gray-600 dark:text-gray-400 ml-4">
              {statement1}
            </p>
          </div>
        )}
        {statement2 && (
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Statement II:</span>
            <p className="text-gray-600 dark:text-gray-400 ml-4">
              {statement2}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-4">
        {options.map((option, idx) => {
          const isUserSelection = userAnswer && userAnswer.toUpperCase() === option.key.toUpperCase();
          const isCorrectOption = correctAnswer && correctAnswer.toUpperCase() === option.key.toUpperCase();
          const isCorrectSelection = isUserSelection && isCorrectOption;
          const isIncorrectSelection = isUserSelection && !isCorrectOption;

          // Determine styling based on status
          let bgColorClass = 'bg-gray-50 dark:bg-gray-800';
          let borderColorClass = 'border-gray-200 dark:border-gray-700';
          let textColorClass = 'text-gray-700 dark:text-gray-300';
          
          if (isCorrectSelection) {
            // User selected correctly
            bgColorClass = 'bg-green-50 dark:bg-green-900/20';
            borderColorClass = 'border-green-300 dark:border-green-700';
            textColorClass = 'text-green-800 dark:text-green-300';
          } else if (isIncorrectSelection) {
            // User selected incorrectly
            bgColorClass = 'bg-red-50 dark:bg-red-900/20';
            borderColorClass = 'border-red-300 dark:border-red-700';
            textColorClass = 'text-red-800 dark:text-red-300';
          } else if (isCorrectOption) {
            // This is the correct option (but not selected)
            bgColorClass = 'bg-green-50 dark:bg-green-900/20';
            borderColorClass = 'border-green-300 dark:border-green-700';
            textColorClass = 'text-green-800 dark:text-green-300';
          } else if (isUserSelection) {
            // User selection that isn't already handled
            bgColorClass = 'bg-blue-50 dark:bg-blue-900/20';
            borderColorClass = 'border-blue-300 dark:border-blue-700';
            textColorClass = 'text-blue-800 dark:text-blue-300';
          }

          return (
            <div
              key={idx}
              className={`p-3 rounded-md border-2 ${bgColorClass} ${borderColorClass}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCorrectSelection
                      ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                      : isIncorrectSelection
                      ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                      : isCorrectOption
                      ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                      : isUserSelection
                      ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.key}
                  </div>
                </div>
                <div className="flex-1">
                  <p className={`${textColorClass} font-medium`}>
                    {option.text}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                  {/* Make the "Your answer" badge more prominent */}
                  {isUserSelection && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                      Your answer
                    </span>
                  )}
                  {isCorrectOption && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      Correct answer
                    </span>
                  )}
                  {isCorrectSelection && (
                    <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                  )}
                  {isIncorrectSelection && (
                    <XCircle className="text-red-600 dark:text-red-400" size={20} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}