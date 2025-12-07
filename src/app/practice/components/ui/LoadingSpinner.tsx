// File: src/app/practice/components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  message?: string;
}

// Skeleton loader that mimics the final practice layout (header, question card,
// and navigator). This reduces layout shift when real content appears.
export function LoadingSpinner({ message = 'Loading practice session...' }: LoadingSpinnerProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
          {/* Title placeholder */}
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

          {/* Right-side meta: subscription info + timer + question count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            {/* Subscription info pill */}
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />

            {/* Timer chip */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </div>

            {/* Question count chip */}
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Progress bar placeholder */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5" />
      </div>

      {/* Question card skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse"
            />
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </div>

      {/* Question navigator skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
