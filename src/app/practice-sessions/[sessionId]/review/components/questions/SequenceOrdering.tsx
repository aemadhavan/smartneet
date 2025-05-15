// src/app/practice-sessions/[sessionId]/review/components/questions/SequenceOrdering.tsx

import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { SequenceOrderingDetails, SequenceOrderingAnswer } from '../interfaces';

interface SequenceOrderingProps {
  details: SequenceOrderingDetails;
  userAnswer: SequenceOrderingAnswer;
  correctAnswer: SequenceOrderingAnswer;
  isImageBased?: boolean;
  imageUrl?: string;
  questionText?: string;
}

/**
 * Component for rendering Sequence Ordering questions
 */
export default function SequenceOrdering({ 
  details, 
  userAnswer, 
  correctAnswer, 
  isImageBased,
  imageUrl,
  questionText
}: SequenceOrderingProps) {
  // Get direct values from normalized data
  const userSelectedOption = userAnswer.selectedOption || '';
  const correctSelectedOption = correctAnswer.selectedOption || '';
  const correctSequence = correctAnswer.sequence || details.correctSequence || [];
  const options = details.options;
  const introText = details.introText || '';
  const items = details.items || [];

  // Find correct option based on isCorrect flag if correctSelectedOption is not provided
  const correctOptionFromFlag = options.find(opt => opt.isCorrect)?.id || '';
  
  // Use provided correct option or fall back to one determined from flags
  const correctOption = correctSelectedOption || correctOptionFromFlag;

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {questionText ?? introText ?? 'No question text available'}
      </div>
      
      {isImageBased && imageUrl && (
        <div className="my-4">
          <Image
            src={imageUrl}
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
      
      {/* Display options */}
      <div className="space-y-2 mt-4">
        {options.map((option, idx) => {
          // Determine the status of this option
          const isUserSelection = userSelectedOption === option.id;
          const isCorrectOption = correctOption === option.id || option.isCorrect;
          const isCorrectSelection = isUserSelection && isCorrectOption;
          const isIncorrectSelection = isUserSelection && !isCorrectOption;
          
          // Style determination logic
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
                    {option.id}
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
      
      {/* Display sequence items if available */}
      {items.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Sequence Items:</h3>
          <div className="grid grid-cols-1 gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">{item.id}:</span>
                  <span className="text-gray-600 dark:text-gray-400">{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Display correct sequence if available and not already shown through options */}
      {correctSequence.length > 0 && !correctOption && (
        <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
          <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Correct Sequence:</h3>
          <div className="flex flex-wrap gap-2">
            {correctSequence.map((item, idx) => (
              <div key={idx} className="flex items-center">
                {idx > 0 && (
                  <span className="text-green-600 dark:text-green-400 mx-1">→</span>
                )}
                <div className="px-3 py-1 bg-green-100 dark:bg-green-800/40 rounded-full text-green-800 dark:text-green-300 font-medium">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}