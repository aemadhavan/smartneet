// src/app/practice/components/session/LoadingSpinner.tsx
import { memo } from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner = memo(function LoadingSpinner({ message = "Loading practice session..." }: LoadingSpinnerProps) {
  return (
    <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
      <div 
        className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8"
        role="progressbar"
        aria-label="Loading"
      />
      <p className="text-gray-600 dark:text-gray-300 text-lg">{message}</p>
    </div>
  );
});

export { LoadingSpinner };