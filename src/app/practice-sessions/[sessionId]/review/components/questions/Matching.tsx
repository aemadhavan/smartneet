import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Define interfaces with more robust type checking
interface Item {
  key: string;
  text: string;
  label?: string; // Added for display purposes
}

// Define structured item interface for directly accessing API data
interface StructuredItem {
  left_item_text: string;
  left_item_label: string;
  right_item_text: string;
  right_item_label: string;
}

interface Option {
  key: string;
  text: string;
  is_correct?: boolean; // Add this for compatibility with API data
}

// Define structured option interface for directly accessing API data
interface StructuredOption {
  is_correct: boolean;
  option_text: string;
  option_number: string;
}

interface Matches {
  [key: string]: string;
}

// Create a more specific answer type to avoid using 'any'
interface MatchingAnswerObject {
  matches?: Matches;
  option?: string; // Add this for selection-type matching questions
  selection?: string; // Add this for compatibility
  selectedOption?: string; // Add this for compatibility
  [key: string]: unknown;
}

// Extend the QuestionAttempt interface to be more specific
interface QuestionAttempt {
  questionText?: string;
  details?: {
    items?: (Item | StructuredItem)[];
    options?: (Option | StructuredOption)[];
    left_items?: Item[];
    right_items?: Option[];
    correctOption?: string; // For selection-based matching questions
    left_column_header?: string; // For structured data
    right_column_header?: string; // For structured data
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: MatchingAnswerObject | string | null;
  correctAnswer?: MatchingAnswerObject | string | null;
  correctOption?: string; // Added for direct correct option reference
  isCorrect?: boolean; // Added to know if the answer was correct
}

interface MatchingProps {
  attempt: QuestionAttempt;
}

// Utility type guard to check if an option is a StructuredOption
function isStructuredOption(option: unknown): option is StructuredOption {
  return typeof option === 'object' && option !== null && 
         'is_correct' in option && 
         'option_text' in option && 
         'option_number' in option;
}

// Utility type guard to check if an option is a StructuredItem
function isStructuredItem(item: unknown): item is StructuredItem {
  return typeof item === 'object' && item !== null && 
         'left_item_text' in item && 
         'left_item_label' in item && 
         'right_item_text' in item && 
         'right_item_label' in item;
}

// Find the correct option letter (A, B, C, D) for the answer
// function findCorrectOptionLetter(attempt: QuestionAttempt): string | null {
//   // First check structured options if available
//   if (attempt.details?.options && Array.isArray(attempt.details.options)) {
//     for (const option of attempt.details.options) {
//       // Check if this is a structured option with is_correct flag
//       if (isStructuredOption(option) && option.is_correct === true) {
//         return option.option_number;
//       }
//     }
//   }
  
//   // Check other properties if structured options didn't give a result
//   if (attempt.correctAnswer) {
//     if (typeof attempt.correctAnswer === 'object' && attempt.correctAnswer !== null) {
//       return (attempt.correctAnswer as MatchingAnswerObject).option || 
//              (attempt.correctAnswer as MatchingAnswerObject).selection || 
//              (attempt.correctAnswer as MatchingAnswerObject).selectedOption || 
//              null;
//     }
//     if (typeof attempt.correctAnswer === 'string') {
//       return attempt.correctAnswer;
//     }
//   }
  
//   // Check explicit correctOption property
//   if (attempt.correctOption) {
//     return attempt.correctOption;
//   }
  
//   return null;
// }

// Get the user-selected option letter
function getUserSelectedOption(attempt: QuestionAttempt): string | null {
  if (!attempt.userAnswer) return null;
  
  if (typeof attempt.userAnswer === 'object' && attempt.userAnswer !== null) {
    const userAnswerObj = attempt.userAnswer as MatchingAnswerObject;
    return userAnswerObj.option || 
           userAnswerObj.selection || 
           userAnswerObj.selectedOption || 
           null;
  }
  
  if (typeof attempt.userAnswer === 'string') {
    // Try to parse JSON if it looks like it
    if (attempt.userAnswer.startsWith('{')) {
      try {
        const parsed = JSON.parse(attempt.userAnswer);
        return parsed.option || parsed.selection || parsed.selectedOption || null;
      } catch (e) {
        console.error('Error parsing user answer:', e);
        // Not JSON, use as-is
      }
    }
    
    return attempt.userAnswer;
  }
  
  return null;
}

// Extract text content for options text display
function getOptionText(option: Option | StructuredOption): string {
  if (isStructuredOption(option)) {
    return option.option_text;
  }
  return option.text;
}

// Extract option number/key for option identifier
function getOptionNumber(option: Option | StructuredOption): string {
  if (isStructuredOption(option)) {
    return option.option_number;
  }
  return option.key;
}

// Check if this is a structured data matching question
function hasStructuredData(attempt: QuestionAttempt): boolean {
  // Check for structured items
  if (attempt.details?.items && 
      attempt.details.items.length > 0 && 
      isStructuredItem(attempt.details.items[0])) {
    return true;
  }
  return false;
}

export default function Matching({ attempt }: MatchingProps) {
  // Get user selection and correct option
  const userSelection = getUserSelectedOption(attempt);
  //const correctOption = findCorrectOptionLetter(attempt);
  
  // Check if we have structured data in the details
  const isStructuredFormat = hasStructuredData(attempt);
  
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

      {/* Display for structured matching questions */}
      {isStructuredFormat && (
        <>
          {/* Display the matching table */}
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-r border-gray-200 dark:border-gray-700">
                    {attempt.details?.left_column_header || 'List I'}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    {attempt.details?.right_column_header || 'List II'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {attempt.details?.items && 
                 attempt.details.items.filter(isStructuredItem).map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                      {item.left_item_label}. {item.left_item_text}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                      {item.right_item_label}. {item.right_item_text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Display answer options */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Answer Options:</h3>
            <div className="space-y-2">
              {attempt.details?.options && 
               attempt.details.options.filter(isStructuredOption).map((option, idx) => {
                const optionNumber = getOptionNumber(option);
                const optionText = getOptionText(option);
                const isCorrect = option.is_correct === true;
                const isSelected = userSelection === optionNumber;
                
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-md border-2 ${
                      isSelected && isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' :
                      isSelected && !isCorrect ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' :
                      isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' :
                      'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected && isCorrect ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' :
                          isSelected && !isCorrect ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' :
                          isCorrect ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {optionNumber}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isSelected && isCorrect ? 'text-green-800 dark:text-green-300' :
                          isSelected && !isCorrect ? 'text-red-800 dark:text-red-300' :
                          isCorrect ? 'text-green-800 dark:text-green-300' :
                          'text-gray-700 dark:text-gray-300'
                        }`}>
                          {optionText}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                        {isSelected && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                            Your answer
                          </span>
                        )}
                        {isCorrect && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            Correct answer
                          </span>
                        )}
                        {isSelected && isCorrect && (
                          <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                        )}
                        {isSelected && !isCorrect && (
                          <XCircle className="text-red-600 dark:text-red-400" size={20} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      
      {/* Message when no matching data is available */}
      {!isStructuredFormat && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 rounded-md">
          <p className="text-yellow-800 dark:text-yellow-300">
            This matching question uses an unsupported format. Please contact support.
          </p>
        </div>
      )}
    </div>
  );
}