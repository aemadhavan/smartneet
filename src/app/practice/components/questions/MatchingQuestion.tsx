// File: src/app/practice/components/questions/MatchingQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
//import { MatchingDetails } from '@/app/practice/types';
import { normalizeMatchingDetails } from '@/app/practice/utils/questionUtils';

interface MatchingQuestionProps {
  details: string | Record<string, unknown>;
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
  if (
    !normalizedDetails ||
    !normalizedDetails.options || !Array.isArray(normalizedDetails.options) ||
    !normalizedDetails.matching_details ||
    !normalizedDetails.matching_details.items || !Array.isArray(normalizedDetails.matching_details.items)
  ) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format.</p>
        <pre className="mt-2 text-xs overflow-auto max-h-40 bg-gray-100 dark:bg-gray-800 p-2 rounded text-gray-800 dark:text-gray-200">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>
    );
  }

  // Use the normalized details
  const { options, matching_details } = normalizedDetails;
  const { items, left_column_header, right_column_header } = matching_details;

  return (
    <div>
      <div className="mb-6 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                {left_column_header || 'List I'}
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                {right_column_header || 'List II'}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-800 dark:text-gray-200">
                  <span className="font-medium mr-2">{item.left_item_label}.</span>
                  {item.left_item_text}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-800 dark:text-gray-200">
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
