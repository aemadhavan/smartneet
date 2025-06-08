'use client';

import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
}

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error</h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
} 