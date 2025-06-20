// src/app/practice-sessions/[sessionId]/review/components/questions/MultipleChoice.tsx

import { CheckCircle, XCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import { LaTeXRenderer } from '@/components/ui/LaTeXRenderer';
import { MultipleChoiceDetails, MultipleChoiceAnswer } from '../interfaces';

interface MultipleChoiceProps {
  details: MultipleChoiceDetails;
  userAnswer: MultipleChoiceAnswer;
  correctAnswer: MultipleChoiceAnswer;
  isImageBased?: boolean;
  imageUrl?: string;
  questionText?: string;
}

export default function MultipleChoice({ 
  details, 
  userAnswer, 
  correctAnswer, 
  isImageBased,
  imageUrl,
  questionText
}: MultipleChoiceProps) {
  // Get direct values from normalized data
  const userSelection = userAnswer?.selectedOption;
  const correctOption = correctAnswer?.selectedOption;
  const options = details.options;
  
  // Check if the question was not answered
  const isUnanswered = !userSelection || userSelection === null || userSelection === undefined;

  return (
    <div className="space-y-4">
      {/* Unanswered question indicator */}
      {isUnanswered && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Not Answered
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              This question was skipped or not attempted during the test
            </span>
          </div>
        </div>
      )}
      
      <div className="text-gray-700 dark:text-gray-300">
        <LaTeXRenderer 
          content={questionText ?? 'No question text available'}
          className="whitespace-pre-line"
        />
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
      
      <div className="space-y-2 mt-4">
        {options.map((option, idx) => {
          // Simplified conditional logic due to normalized structure
          const isUserSelection = userSelection === option.id;
          const isCorrectOption = correctOption === option.id;
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
                  <LaTeXRenderer 
                    content={option.text}
                    className={`${textColorClass} font-medium`}
                    inline={true}
                  />
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