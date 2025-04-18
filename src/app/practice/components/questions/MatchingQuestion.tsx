// File: src/app/practice/components/questions/MatchingQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { MatchingItem, QuestionOption } from '@/app/practice/types';
import { normalizeMatchingDetails } from '@/app/practice/utils/questionUtils';

interface MatchingQuestionProps {
  details: any;
  questionText: string;
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function MatchingQuestion({ 
  details, 
  questionText,
  selectedOption, 
  onOptionSelect 
}: MatchingQuestionProps) {
  // Normalize details to ensure they're in the correct format
  const normalizedDetails = normalizeMatchingDetails(details, questionText);
  
  // Check if normalization was successful
  if (!normalizedDetails || !Array.isArray(normalizedDetails.items) || !Array.isArray(normalizedDetails.options)) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-yellow-700">Invalid question details format.</p>
        <pre className="mt-2 text-xs overflow-auto max-h-40 bg-gray-100 p-2 rounded">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>
    );
  }

  // Use the normalized details
  const { items, options, left_column_header, right_column_header } = normalizedDetails;

  return (
    <div>
      <div className="mb-6 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2 bg-gray-50">
                {left_column_header || 'List I'}
              </th>
              <th className="border px-4 py-2 bg-gray-50">
                {right_column_header || 'List II'}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
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
        {options.map((option, index) => (
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