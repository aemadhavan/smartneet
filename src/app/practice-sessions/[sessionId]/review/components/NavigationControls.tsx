import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationControlsProps {
  currentIndex: number;
  totalQuestions: number;
  goToPrevious: () => void;
  goToNext: () => void;
}

export default function NavigationControls({ 
  currentIndex, 
  totalQuestions, 
  goToPrevious, 
  goToNext 
}: NavigationControlsProps) {
  return (
    <div className="flex justify-between mt-6">
      <button
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        className={`px-4 py-2 rounded-md flex items-center ${
          currentIndex === 0
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/30'
        }`}
      >
        <ArrowLeft size={16} className="mr-1" />
        Previous
      </button>
      
      <button
        onClick={goToNext}
        disabled={currentIndex === totalQuestions - 1}
        className={`px-4 py-2 rounded-md flex items-center ${
          currentIndex === totalQuestions - 1
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/30'
        }`}
      >
        Next
        <ArrowRight size={16} className="ml-1" />
      </button>
    </div>
  );
}