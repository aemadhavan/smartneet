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
  option_number?: string | number;
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
    assertion_reason_details?: {
      assertion_text?: string;
      reason_text?: string;
    };
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
      return String(correctOption.option_number || correctOption.key || '');
    }
  }
  
  return '';
}

// Process the details object from a string if needed
function processDetails(details: any): any {
  if (typeof details === 'string') {
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  }
  return details;
}

export default function AssertionReason({ attempt }: AssertionReasonProps) {
  if (!attempt) return null;

  // Process details if it's a string
  if (typeof attempt.details === 'string') {
    attempt.details = processDetails(attempt.details);
  }
  
  // Process user answer if it's a string that looks like JSON
  let userAnswerObj = attempt.userAnswer;
  if (typeof userAnswerObj === 'string' && userAnswerObj.startsWith('{')) {
    try {
      userAnswerObj = JSON.parse(userAnswerObj);
    } catch {}
  }

  // Process correct answer if it's a string that looks like JSON
  let correctAnswerObj = attempt.correctAnswer;
  if (typeof correctAnswerObj === 'string' && correctAnswerObj.startsWith('{')) {
    try {
      correctAnswerObj = JSON.parse(correctAnswerObj);
    } catch {}
  }
  
  // Get user selection and correct option
  const userAnswer = extractSelection(userAnswerObj)?.toLowerCase();
  
  // First try to get the correct answer from the correctAnswer property
  let correctAnswer = extractSelection(correctAnswerObj)?.toLowerCase();
  
  // If no correct answer was found, try to determine it from the details
  if (!correctAnswer && attempt.details) {
    correctAnswer = findCorrectAnswer(attempt.details)?.toLowerCase();
  }

  // Get statements from the question text or details
  let statement1 = '';
  let statement2 = '';
  
  // Try to get statements from assertion_reason_details if available
  if (attempt.details?.assertion_reason_details) {
    const arDetails = attempt.details.assertion_reason_details;
    
    // Parse the assertion text to extract Statement I
    if (arDetails.assertion_text) {
      const assertionMatch = arDetails.assertion_text.match(/Assertion A:?\s*([^.\n]+)/i);
      if (assertionMatch && assertionMatch[1]) {
        statement1 = assertionMatch[1].trim();
      }
    }
    
    // Parse the reason text to extract Statement II
    if (arDetails.reason_text) {
      const reasonMatch = arDetails.reason_text.match(/Reason R:?\s*([^.\n]+)/i);
      if (reasonMatch && reasonMatch[1]) {
        statement2 = reasonMatch[1].trim();
      }
    }
  }
  
  // Fallback to standard statement fields
  if (!statement1) {
    statement1 = attempt.details?.statement1 || '';
  }
  
  if (!statement2) {
    statement2 = attempt.details?.statement2 || '';
  }
  
  // Try to extract statements from question text if they're not in the details
  if (!statement1 && !statement2 && attempt.questionText) {
    const text = attempt.questionText;
    
    // Look for patterns like "Statement A: ..." and "Statement R: ..."
    const aMatch = text.match(/Assertion\s+A:?\s*([^.\n]+)/i) || 
                  text.match(/Statement\s+I:?\s*([^.\n]+)/i) ||
                  text.match(/Statement\s+A:?\s*([^.\n]+)/i);
    
    const rMatch = text.match(/Reason\s+R:?\s*([^.\n]+)/i) || 
                  text.match(/Statement\s+II:?\s*([^.\n]+)/i) ||
                  text.match(/Statement\s+R:?\s*([^.\n]+)/i);
    
    if (aMatch && aMatch[1]) {
      statement1 = aMatch[1].trim();
    }
    
    if (rMatch && rMatch[1]) {
      statement2 = rMatch[1].trim();
    }
  }

  // Get options from details
  let options: Array<{key: string, text: string}> = [];
  
  if (attempt.details?.options && Array.isArray(attempt.details.options)) {
    options = attempt.details.options.map((opt: QuestionOption) => ({
      key: String(opt.option_number || opt.key || ''),
      text: String(opt.option_text || opt.text || '')
    }));
  } else {
    // Use default options if none provided
    options = [
      {
        key: '1',
        text: 'Both A and R are true and R is the correct explanation of A'
      },
      {
        key: '2',
        text: 'Both A and R are true but R is NOT the correct explanation of A'
      },
      { key: '3', text: 'A is true but R is false' },
      { key: '4', text: 'A is false but R is true' },
      { key: '5', text: 'Both A and R are false' },
    ];
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
          const isUserSelection = userAnswer && userAnswer === String(option.key).toLowerCase();
          const isCorrectOption = correctAnswer && correctAnswer === String(option.key).toLowerCase();
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
