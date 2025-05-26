// File: src/app/practice/components/ui/QuestionNavigator.tsx
import { useRef, useEffect } from 'react';
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
  const navigatorRef = useRef<HTMLDivElement>(null);

  // Set up keyboard navigation
  useEffect(() => {
    const container = navigatorRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Home' || e.key === 'End' || 
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Prevent page scrolling
        e.preventDefault();

        // Find all buttons in the container
        const buttons = Array.from(container.querySelectorAll('button'));
        if (buttons.length === 0) return;

        // Find the currently focused element
        const focusedElement = document.activeElement;
        const focusedIndex = buttons.indexOf(focusedElement as HTMLButtonElement);
        
        let nextIndex = -1;

        // Handle different key presses
        if (e.key === 'Home') {
          nextIndex = 0;
        } else if (e.key === 'End') {
          nextIndex = buttons.length - 1;
        } else if (e.key === 'ArrowLeft') {
          nextIndex = focusedIndex > 0 ? focusedIndex - 1 : buttons.length - 1;
        } else if (e.key === 'ArrowRight') {
          nextIndex = focusedIndex < buttons.length - 1 ? focusedIndex + 1 : 0;
        }

        // Focus the next element if we determined one
        if (nextIndex >= 0) {
          (buttons[nextIndex] as HTMLElement).focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [questions.length]);

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      ref={navigatorRef}
    >
      <h3 
        className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4"
        id="navigator-heading"
      >
        Question Navigator
      </h3>
      <div 
        className="flex flex-wrap gap-2"
        role="navigation" 
        aria-labelledby="navigator-heading"
      >
        {questions.map((q, idx) => {
          const isAnswered = !!userAnswers[q.question_id];
          const isCurrent = idx === currentIndex;
          
          return (
            <button
              key={q.question_id}
              onClick={() => onQuestionSelect(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onQuestionSelect(idx);
                }
              }}
              aria-label={`Question ${idx + 1}${isAnswered ? ' (answered)' : ''}${isCurrent ? ' (current)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                ${isCurrent
                  ? 'bg-indigo-600 text-white'
                  : isAnswered
                  ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all`}
              tabIndex={0}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}