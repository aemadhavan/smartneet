// File: src/app/practice/components/ui/QuestionNavigator.tsx
import { Question } from '@/app/practice/types';

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  userAnswers: Record<number, string>;
  onQuestionSelect: (index: number) => void;
}

export function QuestionNavigator({ 
  questions, 
  currentIndex, 
  userAnswers, 
  onQuestionSelect 
}: QuestionNavigatorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">Question Navigator</h3>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={q.question_id}
            onClick={() => onQuestionSelect(idx)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
              ${idx === currentIndex
                ? 'bg-indigo-600 text-white'
                : userAnswers[q.question_id]
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}