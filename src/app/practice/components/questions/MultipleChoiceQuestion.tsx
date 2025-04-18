// File: src/app/practice/components/questions/MultipleChoiceQuestion.tsx
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
  // Check if details has the expected structure
  if (!details || !Array.isArray(details.options)) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-yellow-700">Invalid question details format.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {details.options.map((option, index: number) => (
        <OptionButton
          key={index}
          option={option}
          isSelected={selectedOption === option.option_number}
          onClick={() => onOptionSelect(option.option_number)}
        />
      ))}
    </div>
  );
}