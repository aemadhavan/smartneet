// src/app/practice-sessions/[sessionId]/review/components/questions/AssertionReason.tsx

import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { AssertionReasonDetails, AssertionReasonAnswer } from '../interfaces';

interface AssertionReasonProps {
  details: AssertionReasonDetails;
  userAnswer: AssertionReasonAnswer;
  correctAnswer: AssertionReasonAnswer;
  isImageBased?: boolean;
  imageUrl?: string;
  questionText?: string;
}

/**
 * Component for rendering Assertion-Reason questions
 */
export default function AssertionReason({ 
  details, 
  userAnswer, 
  correctAnswer, 
  isImageBased,
  imageUrl,
  questionText
}: AssertionReasonProps) {
  // Get direct values from normalized data
  const userSelection = userAnswer.selectedOption;
  const correctOption = correctAnswer.selectedOption;
  const options = details.options;
  const assertion = details.assertion;
  const reason = details.reason;

  // Extract statements - either from dedicated fields or by parsing the assertion text
  let statement1 = '';
  let statement2 = '';

  // If assertion contains both statements, try to extract them
  if (assertion && assertion.includes('Assertion') && assertion.includes('Reason')) {
    const assertionMatch = assertion.match(/Assertion A:?\s*([^.\n]+)/i);
    const reasonMatch = assertion.match(/Reason R:?\s*([^.\n]+)/i);

    if (assertionMatch && assertionMatch[1]) {
      statement1 = assertionMatch[1].trim();
    }
    
    if (reasonMatch && reasonMatch[1]) {
      statement2 = reasonMatch[1].trim();
    }
  } else {
    // Use separate assertion and reason fields
    statement1 = assertion || '';
    statement2 = reason || '';
  }

  // If statements are still empty, try parsing from question text
  if ((!statement1 || !statement2) && questionText) {
    const aMatch = questionText.match(/Assertion A:?\s*([^.\n]+)/i) || 
                 questionText.match(/Statement\s+I:?\s*([^.\n]+)/i) ||
                 questionText.match(/Statement\s+A:?\s*([^.\n]+)/i);
    
    const rMatch = questionText.match(/Reason R:?\s*([^.\n]+)/i) || 
                 questionText.match(/Statement\s+II:?\s*([^.\n]+)/i) ||
                 questionText.match(/Statement\s+R:?\s*([^.\n]+)/i);
    
    if (aMatch && aMatch[1] && !statement1) {
      statement1 = aMatch[1].trim();
    }
    
    if (rMatch && rMatch[1] && !statement2) {
      statement2 = rMatch[1].trim();
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {questionText ?? 'No question text available'}
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

      <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        {statement1 && (
          <div className="mb-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Assertion A:</span>
            <p className="text-gray-600 dark:text-gray-400 ml-4">
              {statement1}
            </p>
          </div>
        )}
        {statement2 && (
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Reason R:</span>
            <p className="text-gray-600 dark:text-gray-400 ml-4">
              {statement2}
            </p>
          </div>
        )}
      </div>

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