import { QuestionAttempt } from './interfaces';

interface QuestionNavigationProps {
  attempts: QuestionAttempt[];
  currentIndex: number;
  goToQuestion: (index: number) => void;
}

export default function QuestionNavigation({ 
  attempts, 
  currentIndex, 
  goToQuestion 
}: QuestionNavigationProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Questions</h2>
      
      <div className="flex flex-wrap gap-2">
        {attempts.map((attempt, idx) => (
          <button
            key={idx}
            onClick={() => goToQuestion(idx)}
            className={`w-10 h-10 flex items-center justify-center rounded-md ${
              currentIndex === idx
                ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                : attempt.isCorrect
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            } hover:bg-opacity-80 transition duration-150`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      
      <div className="flex items-center mt-6 text-sm">
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400 mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Correct</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400 mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Incorrect</span>
        </div>
      </div>
    </div>
  );
}