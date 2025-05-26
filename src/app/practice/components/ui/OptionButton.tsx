// File: src/app/practice/components/ui/OptionButton.tsx
import { KeyboardEvent } from 'react';

interface OptionButtonProps {
  option: {
    option_number?: string | number; // Make option_number optional and allow number
    option_text: string;
  };
  isSelected: boolean;
  onClick: () => void;
  index?: number; // For keyboard navigation with arrow keys
}

export function OptionButton({ option, isSelected, onClick, index }: OptionButtonProps) {
  // Convert option_number to string and uppercase, with fallback
  const optionLabel = option.option_number != null 
    ? String(option.option_number).toUpperCase() 
    : '';

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Select with Space or Enter
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); // Prevent page scroll on space
      onClick();
    }
  };

  const optionId = `option-${optionLabel || index || 'unlabeled'}`;

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0} // Make focusable
      id={optionId}
      className={`border rounded-md p-4 cursor-pointer ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900 dark:border-indigo-400'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start">
        {optionLabel && (
          <span className="font-medium mr-2 text-gray-900 dark:text-gray-100" aria-hidden="true">
            {optionLabel}.
          </span>
        )}
        <div 
          className="text-gray-800 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: option.option_text }} 
        />
      </div>
    </div>
  );
}