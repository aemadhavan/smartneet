//File: src/app/dashboard/page.tsx

import { Suspense } from 'react';
import PracticeClientPage from './client-page';

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8"></div>
        <p className="text-gray-600 text-lg">Loading practice session...</p>
      </div>
    }>
      <PracticeClientPage />
    </Suspense>
  );
}
