// src/app/practice/components/ui/ErrorDisplay.tsx
'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  additionalInfo?: string;
  showHomeLink?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message, 
  onRetry, 
  additionalInfo,
  showHomeLink = true 
}) => {
  return (
    <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 border-b border-red-100 dark:border-red-800">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400 mr-2" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Failed to load practice session
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {message}
          </p>
          
          {additionalInfo && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {additionalInfo}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            )}
            
            {showHomeLink && (
              <Link
                href="/"
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-center transition-colors"
              >
                Back to Home
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;