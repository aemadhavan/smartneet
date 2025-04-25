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
  is_correct?: boolean;
  [key: string]: unknown;
}

// Create more specific types to avoid using 'any'
interface OptionAnswerObject {
  selectedOption?: string;
  selection?: string;
  option?: string; // Add this to handle {"option":"a"} format
  [key: string]: unknown;
}

// Define a more flexible QuestionAttempt interface
interface DiagramBasedQuestionAttempt {
  questionText?: string;
  details?: {
    options?: Option[] | PossibleOptionFormat[] | unknown[] | string[]; // Accept various option formats including JSON strings
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: OptionAnswerObject | string | null;  // Allow string type for user answer
  correctAnswer?: OptionAnswerObject | string | null; // Allow string type for correct answer
}

interface DiagramBasedProps {
  attempt: DiagramBasedQuestionAttempt;
}

// Improved normalize options utility function
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
    // Special case for JSON strings like {"is_correct":false,"option_text":"D","option_number":"a"}
    if (typeof rawOptions[0] === 'string' && 
        (rawOptions[0].includes('"option_text"') || rawOptions[0].includes('"option_number"'))) {
      return rawOptions.map((option, index) => {
        try {
          // Try to parse the JSON string
          let optionObj: Record<string, unknown>;
          
          if (typeof option === 'string') {
            optionObj = JSON.parse(option);
          } else if (typeof option === 'object' && option !== null) {
            optionObj = option as Record<string, unknown>;
          } else {
            // Fallback for unexpected formats
            return {
              key: String.fromCharCode(65 + index),
              text: String(option)
            };
          }
          
          // Extract option_text and option_number
          const key = typeof optionObj.option_number === 'string' ? optionObj.option_number : 
                      typeof optionObj.key === 'string' ? optionObj.key :
                      String.fromCharCode(65 + index);
                      
          const text = typeof optionObj.option_text === 'string' ? optionObj.option_text :
                       typeof optionObj.text === 'string' ? optionObj.text :
                       JSON.stringify(option);
          
          return { key, text };
        } catch (e) {
          console.error('Error parsing option JSON:', e);
          return {
            key: String.fromCharCode(65 + index),
            text: String(option)
          };
        }
      });
    }
    
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

export default function DiagramBased({ attempt }: DiagramBasedProps) {
  // Add null checks for all potentially undefined properties
  const rawOptions = attempt?.details?.options ?? [];
  // Process options to handle the JSON string format
  const options = Array.isArray(rawOptions) ? rawOptions.map(option => {
    if (typeof option !== 'object' || option === null) {
      return { key: 'X', text: 'Unknown option' };
    }

    // The option already has key and text properties
    const optionObj = option as { key: string; text: string };
    
    // But the text property contains a JSON string
    if (typeof optionObj.text === 'string' && optionObj.text.startsWith('{') && optionObj.text.includes('option_text')) {
      try {
        // Parse the JSON in the text property
        const parsedText = JSON.parse(optionObj.text);
        
        // Return a new option with the actual text value
        return {
          key: parsedText.option_number || optionObj.key,
          text: parsedText.option_text || 'Unknown text'
        };
      } catch (e) {
        // If parsing fails, return the original
        return optionObj;
      }
    }
    // If text is not a JSON string, return the original
    return optionObj;
  }) : [];
  
  // UPDATED: Handle all possible formats of user answer
  // Based on your database, the user_answer has {"option":"a"} format
  let userSelection: string | null = null;
  
  if (attempt?.userAnswer) {
    if (typeof attempt.userAnswer === 'object' && attempt.userAnswer !== null) {
      // Type guard to ensure userAnswer is an object
      const userAnswerObj = attempt.userAnswer as OptionAnswerObject;
      userSelection = 
        userAnswerObj.selectedOption ||
        userAnswerObj.selection ||
        userAnswerObj.option ||
        null;
    } else if (typeof attempt.userAnswer === 'string') {
      // Handle case where userAnswer might be a string
      userSelection = attempt.userAnswer;
      
      // Try parsing if it looks like JSON
      if (attempt.userAnswer.startsWith('{') && attempt.userAnswer.includes('option')) {
        try {
          const parsed = JSON.parse(attempt.userAnswer);
          userSelection = parsed.selectedOption || parsed.selection || parsed.option || null;
        } catch (e) {
          console.error('Error parsing user answer:', e);
        }
      }
    }
  }
  
  // Similarly update correct answer handling to check all possible formats
  let correctOption: string | null = null;
  if (attempt?.correctAnswer) {
    if (typeof attempt.correctAnswer === 'object' && attempt.correctAnswer !== null) {
      // Type guard to ensure correctAnswer is an object
      const correctAnswerObj = attempt.correctAnswer as OptionAnswerObject;
      correctOption = 
        correctAnswerObj.selectedOption ||
        correctAnswerObj.selection ||
        correctAnswerObj.option ||
        null;
    } else if (typeof attempt.correctAnswer === 'string') {
      correctOption = attempt.correctAnswer;
      
      // Try parsing if it looks like JSON
      if (attempt.correctAnswer.startsWith('{') && attempt.correctAnswer.includes('option')) {
        try {
          const parsed = JSON.parse(attempt.correctAnswer);
          correctOption = parsed.selectedOption || parsed.selection || parsed.option || null;
        } catch (e) {
          console.error('Error parsing correct answer:', e);
        }
      }
    }
  }
  
  // Render nothing if no attempt data
  if (!attempt) {
    return null;
  }

  // For debugging - remove in production
  console.log('Raw Options:', rawOptions);
  console.log('Normalized Options:', options);
  console.log('User Selection:', userSelection);
  console.log('Correct Option:', correctOption);

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