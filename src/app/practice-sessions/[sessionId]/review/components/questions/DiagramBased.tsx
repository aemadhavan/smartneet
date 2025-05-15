import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Define option interface
interface Option {
  key: string;
  text: string;
  is_correct?: boolean;
}

// Create more specific types to avoid using 'any'
interface OptionAnswerObject {
  selectedOption?: string;
  selection?: string;
  option?: string;
  [key: string]: unknown;
}

// Define a more flexible QuestionAttempt interface
interface DiagramBasedQuestionAttempt {
  questionText?: string;
  details?: {
    options?: unknown[]; // Keep this flexible to handle different formats
    [key: string]: unknown;
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: OptionAnswerObject | string | null;
  correctAnswer?: OptionAnswerObject | string | null;
}

interface DiagramBasedProps {
  attempt: DiagramBasedQuestionAttempt;
}

// Helper function to extract selection from various answer formats
function extractSelection(answer: unknown): string {
  if (!answer) return '';
  
  // If answer is a string
  if (typeof answer === 'string') {
    // If it looks like JSON, try to parse it
    if (answer.startsWith('{') && (answer.includes('option') || answer.includes('selection') || answer.includes('selectedOption'))) {
      try {
        const parsed = JSON.parse(answer);
        return typeof parsed.selectedOption === 'string' || typeof parsed.selectedOption === 'number'
          ? String(parsed.selectedOption) 
          : typeof parsed.selection === 'string' || typeof parsed.selection === 'number'
          ? String(parsed.selection)
          : typeof parsed.option === 'string' || typeof parsed.option === 'number'
          ? String(parsed.option)
          : '';
      } catch (e) {
        console.error('Error parsing answer:', e);
        return answer;
      }
    }
    return answer;
  }
  
  // If answer is an object with any of the possible properties
  if (typeof answer === 'object' && answer !== null) {
    const obj = answer as Record<string, unknown>;
    return String(obj.selectedOption || obj.selection || obj.option || '');
  }
  
  return '';
}

// Define a type for the expected option format
type RawOption = {
  option_number?: string | number;
  key?: string;
  option_text?: string;
  text?: string;
  is_correct?: boolean;
  [key: string]: unknown;
};

// Function to normalize options to a consistent format
function normalizeOptions(rawOptions: unknown[]): Option[] {
  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    return [];
  }
  
  return rawOptions.map(option => {
    // Handle direct option objects that use the expected format
    if (typeof option === 'object' && option !== null) {
      const rawOption = option as RawOption;
      const key = rawOption.option_number !== undefined 
        ? String(rawOption.option_number) 
        : String(rawOption.key || '');
        
      const text = typeof rawOption.option_text === 'string' 
        ? rawOption.option_text 
        : typeof rawOption.text === 'string'
        ? rawOption.text
        : '';
        
      return {
        key,
        text,
        is_correct: !!rawOption.is_correct
      };
    }
    
    // Fallback for unexpected formats
    return {
      key: '',
      text: String(option),
      is_correct: false
    };
  });
}

// Function to find the correct option based on is_correct flag
function findCorrectOption(options: Option[]): string {
  const correctOption = options.find(opt => opt.is_correct);
  return correctOption ? correctOption.key : '';
}

export default function DiagramBased({ attempt }: DiagramBasedProps) {
  if (!attempt) {
    return null;
  }

  // Get options from the attempt
  const rawOptions = attempt.details?.options || [];
  
  // Normalize options to consistent format
  const options = normalizeOptions(rawOptions);
  
  // Extract user selection
  const userSelection = extractSelection(attempt.userAnswer);
  
  // Try to get correct option from correctAnswer, or find it in options
  let correctOption = extractSelection(attempt.correctAnswer);
  
  if (!correctOption) {
    correctOption = findCorrectOption(options);
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
      
      <div className="space-y-2 mt-4">
        {options.length > 0 ? (
          options.map((option, idx) => {
            // Determine the status of this option
            const isUserSelection = userSelection === option.key;
            const isCorrectOption = correctOption === option.key;
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
              // User selection that isn't already handled (should be covered by isIncorrectSelection, but just in case)
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
          })
        ) : (
          <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 rounded-md">
            <p className="text-yellow-800 dark:text-yellow-300">
              No options available for this question.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
