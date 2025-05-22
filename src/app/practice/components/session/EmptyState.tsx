// src/app/practice/components/session/EmptyState.tsx
import { memo } from 'react';

interface EmptyStateProps {
  message?: string;
  buttonText?: string;
  onButtonClick: () => void;
}

const EmptyState = memo(function EmptyState({ 
  message = "No questions available for this selection.",
  buttonText = "Select Another Subject",
  onButtonClick
}: EmptyStateProps) {
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">{message}</p>
      <button
        onClick={onButtonClick}
        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-md text-lg transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
});

export { EmptyState };