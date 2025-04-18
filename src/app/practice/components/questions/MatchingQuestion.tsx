// File: src/app/practice/components/questions/MatchingQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { MatchingDetails } from '@/app/practice/types';

// Define interfaces for the item and option types
interface MatchingItem {
  left_item_label: string;
  left_item_text: string;
  right_item_label: string;
  right_item_text: string;
}

interface OptionItem {
  option_number: string;
  option_text: string;
}

interface MatchingQuestionProps {
  details: {
    items: MatchingItem[];
    options: OptionItem[];
    left_column_header?: string;
    right_column_header?: string;
  };
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function MatchingQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect 
}: MatchingQuestionProps) {
  // Check if details has the expected structure
  if (!details || !Array.isArray(details.items) || !Array.isArray(details.options)) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-yellow-700">Invalid question details format.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2 bg-gray-50">
                {details.left_column_header || 'List I'}
              </th>
              <th className="border px-4 py-2 bg-gray-50">
                {details.right_column_header || 'List II'}
              </th>
            </tr>
          </thead>
          <tbody>
            {details.items.map((item: MatchingItem, index: number) => (
              <tr key={index}>
                <td className="border px-4 py-2">
                  <span className="font-medium mr-2">{item.left_item_label}.</span>
                  {item.left_item_text}
                </td>
                <td className="border px-4 py-2">
                  <span className="font-medium mr-2">{item.right_item_label}.</span>
                  {item.right_item_text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 space-y-3">
        {details.options.map((option: OptionItem, index: number) => (
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