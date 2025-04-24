// File: src/app/practice/components/questions/SequenceOrderingQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { SequenceItem, QuestionOption } from '@/app/practice/types';

interface SequenceOrderingQuestionProps {
  details: {
    sequence_items: SequenceItem[];
    options: QuestionOption[];
  };
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function SequenceOrderingQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect 
}: SequenceOrderingQuestionProps) {
  // Check if details has the expected structure
  if (!details || !Array.isArray(details.sequence_items) || !Array.isArray(details.options)) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">Arrange in correct sequence:</p>
        {details.sequence_items.map((item, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2">
            <div className="flex">
              <span className="font-medium mr-2 text-gray-900 dark:text-gray-100">{item.item_number}.</span>
              <div className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: item.item_text }} />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {details.options.map((option, index) => (
          <OptionButton
            key={index}
            option={option}
            isSelected={selectedOption === option.option_number}
            onClick={() => onOptionSelect(option.option_number)}
          />
        ))}
      </div>
    </div>
  );
}