// src/app/practice-sessions/[sessionId]/review/components/questions/MultipleCorrect.tsx

import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { LaTeXRenderer } from '@/components/ui/LaTeXRenderer';
import { MultipleCorrectDetails, MultipleCorrectAnswer } from '../interfaces';

interface MultipleCorrectProps {
  details: MultipleCorrectDetails;
  userAnswer: MultipleCorrectAnswer;
  correctAnswer: MultipleCorrectAnswer;
  isImageBased?: boolean;
  imageUrl?: string;
  questionText?: string;
}

/**
 * Component for rendering Multiple Correct Statements questions
 */
export default function MultipleCorrect({ 
  details, 
  userAnswer, 
  correctAnswer, 
  isImageBased,
  imageUrl,
  questionText
}: MultipleCorrectProps) {
  // Get direct values from normalized data
  const userSelectedStatements = userAnswer.selectedStatements || [];
  const correctSelectedStatements = correctAnswer.selectedStatements || [];
  const options = details.options;
  const statements = details.statements || [];
  const introText = details.introText || '';

  // For multiple correct statements, we might have text like "B and D only" as the option
  // Let's extract which statements are mentioned in each option
  const parseOptionText = (optionText: string): string[] => {
    // Look for patterns like "A, B and C only" or "B and D only"
    const letterMatches = optionText.match(/[A-Z]/g);
    return letterMatches || [];
  };
  
  // Find which statements are mentioned in the user's selected option
  const userSelectedOptionObj = options.find(opt => 
    userSelectedStatements.includes(opt.id)
  );
  
  // Extract statements referenced in the selected option
  const statementsInUserSelection = userSelectedOptionObj ? 
    parseOptionText(userSelectedOptionObj.text) : [];

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300">
        <LaTeXRenderer 
          content={questionText ?? introText ?? 'No question text available'}
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
      
      {/* Display statements */}
      {statements.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Statements:</h3>
          <div className="space-y-2">
            {statements.map((statement, idx) => {
              // Check if this statement is selected directly or through option
              const isSelected = statementsInUserSelection.includes(statement.id);
              const isCorrect = statement.isCorrect;
              
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-md border-2 ${
                    isSelected && isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                      : isSelected && !isCorrect 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                      : isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected && isCorrect 
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                          : isSelected && !isCorrect 
                          ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' 
                          : isCorrect 
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {statement.id}
                      </div>
                    </div>
                    <div className="flex-1">
                      <LaTeXRenderer 
                        content={statement.text}
                        className={`font-medium ${
                          isSelected && isCorrect 
                            ? 'text-green-800 dark:text-green-300' 
                            : isSelected && !isCorrect 
                            ? 'text-red-800 dark:text-red-300' 
                            : isCorrect 
                            ? 'text-green-800 dark:text-green-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        inline={true}
                      />
                    </div>
                    <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                      {isCorrect && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Correct
                        </span>
                      )}
                      {isSelected && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Display options section */}
      {options.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Your Selection:</h3>
          <div className="space-y-2">
            {options.map((option, idx) => {
              // Check if this option is selected
              const isSelected = userSelectedStatements.includes(option.id);
              const isCorrect = correctSelectedStatements.includes(option.id) || option.isCorrect;
              
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-md border-2 ${
                    isSelected && isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                      : isSelected && !isCorrect 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                      : isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected && isCorrect 
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                          : isSelected && !isCorrect 
                          ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' 
                          : isCorrect 
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.id}
                      </div>
                    </div>
                    <div className="flex-1">
                      <LaTeXRenderer 
                        content={option.text}
                        className={`font-medium ${
                          isSelected && isCorrect 
                            ? 'text-green-800 dark:text-green-300' 
                            : isSelected && !isCorrect 
                            ? 'text-red-800 dark:text-red-300' 
                            : isCorrect 
                            ? 'text-green-800 dark:text-green-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        inline={true}
                      />
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
      )}
    </div>
  );
}