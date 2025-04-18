// File: src/app/practice/components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
    message?: string;
  }
  
  export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8"></div>
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    );
  }
  