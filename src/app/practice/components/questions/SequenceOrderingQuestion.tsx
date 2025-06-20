// File: src/app/practice/components/questions/SequenceOrderingQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { LaTeXRenderer } from '@/components/ui/LaTeXRenderer';
import { SequenceOrderingDetails } from '@/app/practice/types'; // Import the specific type

interface SequenceOrderingQuestionProps {
  details: SequenceOrderingDetails; // Use the imported type
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function SequenceOrderingQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect 
}: SequenceOrderingQuestionProps) {
  // Check if details has the expected structure
  if (!details || !Array.isArray(details.options)) { // sequence_items can be empty, options are essential
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format (missing options).</p>
      </div>
    );
  }
  
  // Ensure sequence_items is an array, even if empty, to prevent map errors
  const sequenceItems = Array.isArray(details.sequence_items) ? details.sequence_items : [];

  return (
    <div>
      <div className="mb-6 space-y-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <LaTeXRenderer 
          content={details.intro_text || 'Arrange in correct sequence:'}
          className="font-medium mb-2 text-gray-900 dark:text-gray-100"
        />
        {sequenceItems.map((item, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2">
            <div className="flex">
              <span className="font-medium mr-2 text-gray-900 dark:text-gray-100 flex-shrink-0">
                {item.item_number}.
              </span>
              <div className="flex-1">
                <LaTeXRenderer 
                  content={item.item_text}
                  className="text-gray-800 dark:text-gray-200"
                  inline={true}
                />
              </div>
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