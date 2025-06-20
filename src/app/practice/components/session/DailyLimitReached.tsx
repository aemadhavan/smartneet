// src/app/practice/components/session/DailyLimitReached.tsx
import { memo } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface DailyLimitReachedProps {
  reason?: string;
  onRetry: () => void;
}

const DailyLimitReached = memo(function DailyLimitReached({ 
  reason = "You've reached your daily practice test limit. Upgrade to Premium for unlimited practice tests.",
  onRetry
}: DailyLimitReachedProps) {
  // Calculate next UTC midnight in user's local time
  const now = new Date();
  const nextUtcMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const localTimeString = nextUtcMidnight.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const localDateString = nextUtcMidnight.toLocaleDateString();
  const resetMessage = `You can take more tests after ${localTimeString} on ${localDateString} (your local time).`;

  return (
    <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 border-b border-red-100 dark:border-red-800">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400 mr-2" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Daily Test Limit Reached
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {reason}
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            {resetMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link
              href="/pricing"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-center transition-colors"
            >
              Upgrade to Premium
            </Link>
            
            <button
              onClick={onRetry}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-center transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export { DailyLimitReached };