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
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-yellow-700">Invalid question details format.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-2 border-b pb-4">
        <p className="font-medium mb-2">Arrange in correct sequence:</p>
        {details.sequence_items.map((item, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded mb-2">
            <div className="flex">
              <span className="font-medium mr-2">{item.item_number}.</span>
              <div dangerouslySetInnerHTML={{ __html: item.item_text }} />
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