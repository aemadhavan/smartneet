// File: src/app/practice/components/questions/MultipleChoiceQuestion.tsx
import { useRef, useEffect } from 'react';
import { OptionButton } from '@/app/practice/components/ui';
import { MultipleChoiceDetails } from '@/app/practice/types';

interface MultipleChoiceQuestionProps {
  details: MultipleChoiceDetails;
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function MultipleChoiceQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect 
}: MultipleChoiceQuestionProps) {
  const optionsContainerRef = useRef<HTMLDivElement>(null);

  // Set up keyboard navigation with arrow keys
  useEffect(() => {
    const container = optionsContainerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Find all radio elements in the container
      const options = Array.from(container.querySelectorAll('[role="radio"]'));
      if (options.length === 0) return;

      // Find the currently focused element
      const focusedElement = document.activeElement;
      const focusedIndex = options.indexOf(focusedElement as Element);
      
      let nextIndex = -1;

      // Handle arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = focusedIndex < options.length - 1 ? focusedIndex + 1 : 0;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = focusedIndex > 0 ? focusedIndex - 1 : options.length - 1;
      }

      // Focus the next element if we determined one
      if (nextIndex >= 0) {
        (options[nextIndex] as HTMLElement).focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [details.options.length]);

  // Check if details has the expected structure
  if (!details || !Array.isArray(details.options)) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format.</p>
      </div>
    );
  }

  return (
    <div 
      className="space-y-3" 
      ref={optionsContainerRef}
      role="radiogroup"
      aria-label="Select an answer"
    >
      {details.options.map((option, index: number) => (
        <OptionButton
          key={index}
          index={index}
          option={option}
          isSelected={selectedOption === option.option_number}
          onClick={() => onOptionSelect(option.option_number)}
        />
      ))}
    </div>
  );
}