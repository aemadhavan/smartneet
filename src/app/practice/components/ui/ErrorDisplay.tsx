// File: src/app/practice/components/ui/ErrorDisplay.tsx
interface ErrorDisplayProps {
    message: string;
    onRetry: () => void;
  }
  
  export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-red-500 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Failed to load practice session</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        <button
          onClick={onRetry}
          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          Retry
        </button>
      </div>
    );
  }