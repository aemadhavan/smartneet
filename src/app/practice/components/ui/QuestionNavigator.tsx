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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-4">Question Navigator</h3>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={q.question_id}
            onClick={() => onQuestionSelect(idx)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
              ${idx === currentIndex
                ? 'bg-indigo-600 text-white'
                : userAnswers[q.question_id]
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}