// src/app/practice-sessions/[sessionId]/review/components/questions/Matching.tsx

import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { LaTeXRenderer } from '@/components/ui/LaTeXRenderer';
import { MatchingDetails, MatchingAnswer } from '../interfaces';

interface MatchingProps {
  details: MatchingDetails;
  userAnswer: MatchingAnswer;
  correctAnswer: MatchingAnswer;
  isImageBased?: boolean;
  imageUrl?: string;
  questionText?: string;
}

/**
 * Component for rendering Matching questions
 */
export default function Matching({ 
  details, 
  userAnswer, 
  correctAnswer, 
  isImageBased,
  imageUrl,
  questionText
}: MatchingProps) {
  // Get direct values from normalized data
  const userSelection = userAnswer.selectedOption;
  const correctOption = correctAnswer.selectedOption || '';
  const options = details.options;
  const matchingColumns = details.matchingColumns;

  return (
    <div className="space-y-4">
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
      
      {/* Display the matching table */}
      {matchingColumns && (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-r border-gray-200 dark:border-gray-700">
                  <LaTeXRenderer 
                    content={matchingColumns.left.header}
                    className="font-medium"
                    inline={true}
                  />
                </th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  <LaTeXRenderer 
                    content={matchingColumns.right.header}
                    className="font-medium"
                    inline={true}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {matchingColumns.left.items.map((leftItem, idx) => {
                // Find corresponding right item if available
                const rightItem = matchingColumns.right.items[idx];
                
                return (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-start">
                        <span className="font-medium mr-2 flex-shrink-0">{leftItem.id}.</span>
                        <div className="flex-1">
                          <LaTeXRenderer 
                            content={leftItem.text}
                            className="text-gray-800 dark:text-gray-300"
                            inline={true}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                      {rightItem && (
                        <div className="flex items-start">
                          <span className="font-medium mr-2 flex-shrink-0">{rightItem.id}.</span>
                          <div className="flex-1">
                            <LaTeXRenderer 
                              content={rightItem.text}
                              className="text-gray-800 dark:text-gray-300"
                              inline={true}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Display answer options */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Answer Options:</h3>
        <div className="space-y-2">
          {options.map((option, idx) => {
            // Determine the status of this option
            const isSelected = userSelection === option.id;
            const isCorrectOption = correctOption === option.id || option.isCorrect;
            const isCorrectSelection = isSelected && isCorrectOption;
            const isIncorrectSelection = isSelected && !isCorrectOption;
            
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
            } else if (isSelected) {
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
                        : isSelected
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
                    {isSelected && (
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
    </div>
  );
}