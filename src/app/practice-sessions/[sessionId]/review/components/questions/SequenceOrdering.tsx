import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Interfaces for more specific typing
interface SequenceItem {
  item_number: number;
  item_label: string;
  item_text: string;
}

interface SequenceOption {
  is_correct: boolean;
  option_text: string;
  option_number: number;
}

interface SequenceDetails {
  items?: SequenceItem[] | null;
  intro_text: string;
  correct_sequence: number[];
}

interface QuestionAttempt {
  questionText?: string;
  details?: {
    options?: SequenceOption[];
    sequence_details?: SequenceDetails;
    [key: string]: unknown;
  } | null;
  isImageBased?: boolean;
  imageUrl?: string;
  userAnswer?: string | { selectedOption?: string | number } | null;
  correctAnswer?: string | { option?: string | number } | null;
}

interface SequenceOrderingProps {
  attempt: QuestionAttempt;
}

// Helper function to extract selection from various answer formats
function extractSelection(answer: unknown): string {
  if (!answer) return '';
  
  // If answer is a string
  if (typeof answer === 'string') {
    // If it looks like JSON, try to parse it
    if (answer.startsWith('{') && answer.includes('"selectedOption"')) {
      try {
        const parsed = JSON.parse(answer);
        return typeof parsed.selectedOption === 'string' || typeof parsed.selectedOption === 'number' 
          ? String(parsed.selectedOption) 
          : '';
      } catch (e) {
        // Not valid JSON, return the string itself if it's a single character or number
        if (/^\d+$/.test(answer)) return answer;
      }
    }
    // If it's a number as string, it might be a direct selection
    if (/^\d+$/.test(answer)) return answer;
  }
  
  // If answer is an object with any of the possible properties
  if (typeof answer === 'object' && answer !== null) {
    if ('selectedOption' in answer) {
      const selectedOption = (answer as { selectedOption?: string | number }).selectedOption;
      return selectedOption !== undefined ? String(selectedOption) : '';
    }
    
    if ('option' in answer) {
      const option = (answer as { option?: string | number }).option;
      return option !== undefined ? String(option) : '';
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

export default function SequenceOrdering({ attempt }: SequenceOrderingProps) {
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
  const userAnswer = extractSelection(userAnswerObj);
  const correctOption = extractSelection(correctAnswerObj);
  
  // Get options and sequence details from attempt
  const options = attempt.details?.options || [];
  const sequenceDetails = attempt.details?.sequence_details;
  
  // Find the correct option from the options array if not specified in correctAnswer
  const correctOptionFromOptions = options.find(opt => opt.is_correct)?.option_number.toString() || '';
  
  // Use the specified correct answer or fall back to the one from options
  const correctOptionNumber = correctOption || correctOptionFromOptions;
  
  // Get the intro text
  const introText = sequenceDetails?.intro_text || attempt.questionText || 'Arrange the items in the correct sequence:';

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {introText}
      </div>

      {attempt.isImageBased && attempt.imageUrl && (
        <div className="my-4">
          <Image
            src={attempt.imageUrl}
            alt="Question diagram"
            width={500}
            height={300}
            className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      )}

      <div className="space-y-2 mt-4">
        {options.map((option, idx) => {
          const isUserSelection = userAnswer === option.option_number.toString();
          const isCorrectOption = correctOptionNumber === option.option_number.toString();
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
                    {option.option_number}
                  </div>
                </div>
                <div className="flex-1">
                  <p className={`${textColorClass} font-medium`}>
                    {option.option_text}
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

      {/* If the sequence_details contains individual items, we can show them separately */}
      {sequenceDetails?.items && sequenceDetails.items.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Sequence Items:</h3>
          <div className="grid grid-cols-1 gap-2">
            {sequenceDetails.items.map((item, idx) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">{item.item_label || item.item_number}:</span>
                  <span className="text-gray-600 dark:text-gray-400">{item.item_text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If correct_sequence is available, show the correct ordering */}
      {sequenceDetails?.correct_sequence && sequenceDetails.correct_sequence.length > 0 && !correctOptionNumber && (
        <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
          <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Correct Sequence:</h3>
          <div className="flex flex-wrap gap-2">
            {sequenceDetails.correct_sequence.map((itemNum, idx) => (
              <div key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-800/40 rounded-full text-green-800 dark:text-green-300 font-medium">
                {idx > 0 ? " → " : ""}{itemNum}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}