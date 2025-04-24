export default function LoadingState() {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8"></div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Loading review data...</p>
      </div>
    );
  }