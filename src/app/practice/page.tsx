'use client';

//File: src/app/practice/page.tsx

import { Suspense } from 'react';
import PracticeClientPage from './client-page';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';

// Loading fallback component
const LoadingFallback = () => (
  <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
    <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8"></div>
    <p className="text-gray-600 dark:text-gray-300 text-lg">Loading practice session...</p>
  </div>
);

export default function PracticePage() {
  // Function to handle ErrorBoundary resets
  const handleErrorReset = () => {
    logger.info('Practice page error boundary reset', { context: 'PracticePage' });
    // Could potentially clear some cache or state here if needed
  };

  return (
    <ErrorBoundary onReset={handleErrorReset}>
      <Suspense fallback={<LoadingFallback />}>
        <PracticeClientPage />
      </Suspense>
    </ErrorBoundary>
  );
}