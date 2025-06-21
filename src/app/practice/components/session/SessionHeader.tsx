// src/app/practice/components/session/SessionHeader.tsx
import { memo } from 'react';

interface SessionHeaderProps {
  title: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  children?: React.ReactNode;
  elapsedTime?: string;
  isTimerRunning?: boolean;
}

const SessionHeader = memo(function SessionHeader({ 
  title,
  currentQuestionIndex,
  totalQuestions,
  children,
  elapsedTime,
  isTimerRunning
}: SessionHeaderProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {children}
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <div className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="font-mono">{elapsedTime || '0:00'}</span>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
        <div
          className="bg-indigo-600 h-2.5 rounded-full"
          style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}
          aria-label={`Progress: ${currentQuestionIndex + 1} of ${totalQuestions} questions`}
        ></div>
      </div>
    </>
  );
});

export { SessionHeader };