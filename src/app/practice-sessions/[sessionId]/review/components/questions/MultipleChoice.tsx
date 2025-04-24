import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Define option interface
interface Option {
  key: string;
  text: string;
}

// Create more specific types to avoid using 'any'
interface OptionAnswerObject {
  selectedOption?: string;
  [key: string]: unknown; // More type-safe than 'any'
}

// Define a more flexible QuestionAttempt interface
interface QuestionAttempt {
  questionText?: string;
  details?: {
    options?: Option[];
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: OptionAnswerObject | null;
  correctAnswer?: OptionAnswerObject | null;
}

interface MultipleChoiceProps {
  attempt: QuestionAttempt;
}

// Normalize options utility function
function normalizeOptions(rawOptions: unknown): Option[] {
  // If rawOptions is already an array of objects with key and text, return it
  if (Array.isArray(rawOptions) && rawOptions.every(o => 
    typeof o === 'object' && o !== null && 'key' in o && 'text' in o)) {
    return rawOptions as Option[];
  }
  
  // If it's an array of strings or other types, convert to Option
  return (Array.isArray(rawOptions) ? rawOptions : []).map((option, index: number) => ({
    key: String.fromCharCode(65 + index), // A, B, C, etc.
    text: String(option)
  }));
}

export default function MultipleChoice({ attempt }: MultipleChoiceProps) {
  // Add null checks for all potentially undefined properties
  const rawOptions = attempt?.details?.options ?? [];
  const options = normalizeOptions(rawOptions);
  const userSelection = attempt?.userAnswer?.selectedOption ?? null;
  const correctOption = attempt?.correctAnswer?.selectedOption ?? null;
  
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
      
      <div className="space-y-2 mt-4">
        {options.map((option, idx) => {
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
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
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