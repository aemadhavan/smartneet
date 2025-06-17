// src/app/practice/components/ui/OptionButton.tsx
import { LaTeXRenderer } from '@/components/ui/LaTeXRenderer';

interface OptionButtonProps {
  option: {
    option_number: string | number;
    option_text: string;
  };
  isSelected: boolean;
  onClick: () => void;
  index?: number;
}

export function OptionButton({ option, isSelected, onClick, index }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
      role="radio"
      aria-checked={isSelected}
      aria-labelledby={`option-${index || option.option_number}`}
      tabIndex={isSelected ? 0 : -1}
    >
      <div className="flex items-start">
        <span 
          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium mr-3 ${
            isSelected
              ? 'border-indigo-500 bg-indigo-500 text-white'
              : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
          }`}
        >
          {option.option_number}
        </span>
        <div className="flex-1 min-w-0">
          <LaTeXRenderer 
            content={option.option_text}
            className="text-gray-800 dark:text-gray-200"
            inline={true}
          />
        </div>
      </div>
    </button>
  );
}