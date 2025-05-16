// src/app/practice-sessions/[sessionId]/review/components/questions/DiagramBased.tsx

import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { DiagramBasedDetails, DiagramBasedAnswer } from '../interfaces';

interface DiagramBasedProps {
  details: DiagramBasedDetails;
  userAnswer: DiagramBasedAnswer;
  correctAnswer: DiagramBasedAnswer;
  isImageBased?: boolean;
  imageUrl?: string;
  questionText?: string;
}

/**
 * Component for rendering Diagram-Based questions
 */
export default function DiagramBased({ 
  details, 
  userAnswer, 
  correctAnswer, 
  isImageBased,
  imageUrl,
  questionText
}: DiagramBasedProps) {
  // Get direct values from normalized data
  const userSelection = userAnswer.selectedOption;
  const correctOption = correctAnswer.selectedOption;
  const options = details.options;
  const diagramDescription = details.diagramDescription || '';

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {questionText ?? 'No question text available'}
      </div>
      
      {/* Display diagram image - always show if isImageBased or if we have an imageUrl */}
      {(isImageBased || imageUrl) && (
        <div className="my-4">
          {diagramDescription && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 italic">
              {diagramDescription}
            </p>
          )}
          <Image
            src={imageUrl || ''}
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
          const isUserSelection = userSelection === option.id;
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
    </div>
  );
}