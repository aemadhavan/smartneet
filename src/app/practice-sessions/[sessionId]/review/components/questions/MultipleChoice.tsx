import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Define option interface
interface Option {
  key: string;
  text: string;
}

// Possible option formats for incoming data
interface PossibleOptionFormat {
  text?: string;
  label?: string;
  value?: string;
  content?: string;
  option_text?: string;
  option_number?: string;
  key?: string;
  is_correct?: boolean;
  [key: string]: unknown;
}

// Create more specific types to avoid using 'any'
interface OptionAnswerObject {
  selectedOption?: string;
  selection?: string;
  option?: string; // For {"option":"a"} format
  answer?: string; // Add this for {"answer":"a"} format
  value?: string;  // Add this for {"value":"a"} format
  [key: string]: unknown;
}

// Define a more flexible QuestionAttempt interface
interface QuestionAttempt {
  questionText?: string;
  details?: {
    options?: Option[] | PossibleOptionFormat[] | unknown[];
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: OptionAnswerObject | string | number | null;
  correctAnswer?: OptionAnswerObject | string | number | null;
  questionId?: number;
  isCorrect?: boolean;
}

interface MultipleChoiceProps {
  attempt: QuestionAttempt;
}

// Normalize options utility function
function normalizeOptions(rawOptions: unknown): Option[] {
  // If no options, return empty array
  if (!rawOptions) return [];
  
  // If rawOptions is already an array of objects with key and text, return it
  if (Array.isArray(rawOptions) && rawOptions.length > 0 && 
      rawOptions.every(o => typeof o === 'object' && o !== null && 'key' in o && 'text' in o)) {
    return rawOptions as Option[];
  }
  
  // If it's an array but has different structure
  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    const firstItem = rawOptions[0];
    
    // Check if items might be objects with different properties
    if (typeof firstItem === 'object' && firstItem !== null) {
      // Try to extract text from common properties
      if ('text' in firstItem || 'label' in firstItem || 'value' in firstItem || 'content' in firstItem || 
          'option_text' in firstItem || 'option_number' in firstItem) {
        return rawOptions.map((option, index) => {
          const typedOption = option as PossibleOptionFormat;
          return {
            key: typedOption.option_number || 
                 typedOption.key?.toString() || 
                 String.fromCharCode(65 + index), // A, B, C, etc.
            text: String(
              typedOption.option_text ||
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
}

// Improved function to extract selected option from user answer
function extractSelectedOption(answer: unknown): string | null {
  // Handle null or undefined
  if (answer === null || answer === undefined) return null;

  // If it's an object
  if (typeof answer === 'object' && answer !== null) {
    const answerObj = answer as Record<string, unknown>;
    
    // First check the most common properties
    if (answerObj.selectedOption !== undefined) {
      return String(answerObj.selectedOption).toUpperCase();
    }
    
    if (answerObj.selection !== undefined) {
      return String(answerObj.selection).toUpperCase();
    }
    
    if (answerObj.option !== undefined) {
      return String(answerObj.option).toUpperCase();
    }
    
    // Then check for less common but possible properties
    if (answerObj.answer !== undefined) {
      return String(answerObj.answer).toUpperCase();
    }
    
    if (answerObj.value !== undefined) {
      return String(answerObj.value).toUpperCase();
    }
    
    return null;
  }

  // If it's a string, first try parsing as JSON
  if (typeof answer === 'string') {
    // Direct single letter answers
    if (answer.length === 1 && /[A-Z0-9]/i.test(answer)) {
      return answer.toUpperCase();
    }
    
    // Try to parse as JSON if it looks like a JSON object
    if (answer.includes('{') || answer.includes(':')) {
      try {
        const parsed = JSON.parse(answer);
        if (typeof parsed === 'object' && parsed !== null) {
          // Check for common properties in the parsed object
          const selection = 
            parsed.selectedOption || 
            parsed.selection || 
            parsed.option || 
            parsed.answer || 
            parsed.value;
          
          return selection ? String(selection).toUpperCase() : null;
        }
      } catch (e) {
        console.error('Error parsing user answer:', e);
        // Not valid JSON, continue with the string as is
      }
    }
    
    // If the string represents a letter or number, use it
    if (answer.length <= 2) {
      return answer.toUpperCase();
    }
  }

  // For primitive types (numbers)
  if (typeof answer === 'number') {
    return String(answer).toUpperCase();
  }

  return null;
}

// Normalize the option key for better comparison
function normalizeKey(key: unknown): string {
  // Handle null, undefined, or empty inputs
  if (key === null || key === undefined) return '';
  
  // Convert to string and trim
  const keyStr = String(key).toUpperCase().trim();
  
  // Handle numeric keys (1 -> A, 2 -> B, etc.)
  if (/^\d+$/.test(keyStr)) {
    const num = parseInt(keyStr, 10);
    return num > 0 && num <= 26 
      ? String.fromCharCode(64 + num) 
      : keyStr;
  }
  
  // Return first character if it's a valid letter
  if (/^[A-Z]/.test(keyStr)) {
    return keyStr[0];
  }
  
  return keyStr;
}

// Reverse-engineer user selection from isCorrect and correctAnswer
function findLikelyUserSelection(
  attempt: QuestionAttempt, 
  options: Option[], 
  correctOption: string
): string | null {
  // If the answer is correct, then user selection must be the correct option
  if (attempt.isCorrect === true) {
    return correctOption;
  }
  
  // If we know it's incorrect, we need to guess which wrong option they chose
  // For now, let's just return the first option that isn't the correct one
  // This is a fallback and not ideal
  const wrongOption = options.find(opt => normalizeKey(opt.key) !== correctOption);
  return wrongOption ? normalizeKey(wrongOption.key) : null;
}

export default function MultipleChoice({ attempt }: MultipleChoiceProps) {
  // Check if attempt exists
  if (!attempt) {
    return null;
  }

  const rawOptions = attempt?.details?.options ?? [];
  const options = normalizeOptions(rawOptions);
  
  // Extract and normalize user and correct selections
  const userSelectionRaw = extractSelectedOption(attempt?.userAnswer);
  const correctOptionRaw = extractSelectedOption(attempt?.correctAnswer);
  
  // Normalize keys for better comparison
  let userSelection = normalizeKey(userSelectionRaw);
  const correctOption = normalizeKey(correctOptionRaw);
  
  // If user selection is empty or invalid but we know the attempt.isCorrect status,
  // use that to infer what the user selection should be
  if (!userSelection && attempt.isCorrect !== undefined) {
    const inferredSelection = findLikelyUserSelection(attempt, options, correctOption);
    if (inferredSelection) {
      userSelection = inferredSelection;
    }
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
        {options.map((option, idx) => {
          // Normalize option key for comparison
          const normalizedOptionKey = normalizeKey(option.key);
          
          // Determine the status of this option
          const isUserSelection = userSelection === normalizedOptionKey;
          const isCorrectOption = correctOption === normalizedOptionKey;
          const isCorrectSelection = isUserSelection && isCorrectOption;
          const isIncorrectSelection = isUserSelection && !isCorrectOption;
          
          // Special case: If we're showing an inferred user selection, adjust the styles
          const isInferredSelection = !userSelectionRaw && isUserSelection;
          
          // Determine styling based on status
          let bgColorClass = 'bg-gray-50 dark:bg-gray-800';
          let borderColorClass = 'border-gray-200 dark:border-gray-700';
          let textColorClass = 'text-gray-700 dark:text-gray-300';
          
          if (isCorrectSelection) {
            bgColorClass = 'bg-green-50 dark:bg-green-900/20';
            borderColorClass = 'border-green-300 dark:border-green-700';
            textColorClass = 'text-green-800 dark:text-green-300';
          } else if (isIncorrectSelection) {
            bgColorClass = 'bg-red-50 dark:bg-red-900/20';
            borderColorClass = 'border-red-300 dark:border-red-700';
            textColorClass = 'text-red-800 dark:text-red-300';
          } else if (isCorrectOption) {
            bgColorClass = 'bg-green-50 dark:bg-green-900/20';
            borderColorClass = 'border-green-300 dark:border-green-700';
            textColorClass = 'text-green-800 dark:text-green-300';
          } else if (isUserSelection) {
            // For inferred selections, use a slightly different style
            if (isInferredSelection) {
              bgColorClass = 'bg-orange-50 dark:bg-orange-900/20';
              borderColorClass = 'border-orange-300 dark:border-orange-700';
              textColorClass = 'text-orange-800 dark:text-orange-300';
            } else {
              bgColorClass = 'bg-blue-50 dark:bg-blue-900/20';
              borderColorClass = 'border-blue-300 dark:border-blue-700';
              textColorClass = 'text-blue-800 dark:text-blue-300';
            }
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
                      : isUserSelection && isInferredSelection
                      ? 'bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-300' 
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isInferredSelection 
                        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                    }`}>
                      {isInferredSelection ? 'Likely answer' : 'Your answer'}
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