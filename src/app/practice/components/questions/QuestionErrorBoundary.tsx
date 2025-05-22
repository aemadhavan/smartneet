'use client';

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';

interface QuestionErrorBoundaryProps {
  children: React.ReactNode;
  questionId: number;
  questionType: string;
  onSkipQuestion?: () => void;
}

const QuestionErrorFallback = ({ questionId, questionType, onSkipQuestion }: {
  questionId: number;
  questionType: string;
  onSkipQuestion?: () => void;
}) => {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md border border-yellow-200 dark:border-yellow-700" role="alert">
      <div className="flex items-start mb-3">
        <div className="flex-shrink-0 text-yellow-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-medium">Question Error</h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
            There was an error rendering this {questionType} question (ID: {questionId}).
          </p>
          {onSkipQuestion && (
            <button
              onClick={onSkipQuestion}
              className="mt-3 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:hover:bg-yellow-700 dark:text-yellow-100 rounded"
              aria-label="Skip to next question"
            >
              Skip This Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export function QuestionErrorBoundary({
  children,
  questionId,
  questionType,
  onSkipQuestion
}: QuestionErrorBoundaryProps) {
  const handleError = () => {
    logger.error('Error in question component', {
      context: 'QuestionErrorBoundary',
      data: {
        questionId,
        questionType
      }
    });
    
    // If there's a skip question function, we don't need to do anything else
    // as the fallback UI will provide the skip button
  };

  return (
    <ErrorBoundary
      onReset={handleError}
      fallback={
        <QuestionErrorFallback
          questionId={questionId}
          questionType={questionType}
          onSkipQuestion={onSkipQuestion}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default QuestionErrorBoundary;