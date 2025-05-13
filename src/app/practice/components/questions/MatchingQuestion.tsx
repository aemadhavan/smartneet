// File: src/app/practice/components/questions/MatchingQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { normalizeMatchingDetails, parseMatchingQuestion } from '@/app/practice/utils/questionUtils';

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
  // First try to normalize details with the existing normalizer
  const normalizedDetails = normalizeMatchingDetails(details, questionText);
  
  // If normalization completely failed (no valid details at all)
  if (!normalizedDetails || !normalizedDetails.options || !Array.isArray(normalizedDetails.options)) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format: missing options.</p>
      </div>
    );
  }

  // Get options from normalized details
  const { options } = normalizedDetails;
  
  // Handle the case where matching_details.items is missing or empty
  if (!normalizedDetails.matching_details?.items || 
      !Array.isArray(normalizedDetails.matching_details.items) || 
      normalizedDetails.matching_details.items.length === 0) {
    
    // Try to directly extract matching items from the question text if not already done by normalizer
    const { listI, listII } = parseMatchingQuestion(questionText);
    
    // If we successfully extracted matching items from question text
    if (listI.length > 0 && listII.length > 0) {
      // Map the extracted lists to matching items
      const extractedItems = listI.slice(0, Math.min(listI.length, listII.length)).map((leftItem, index) => ({
        left_item_label: leftItem.label,
        left_item_text: leftItem.text,
        right_item_label: listII[index].label,
        right_item_text: listII[index].text
      }));
      
      // If we have items, render the matching question with them
      if (extractedItems.length > 0) {
        return renderMatchingQuestion(
          options, 
          extractedItems,
          "List I",
          "List II",
          selectedOption,
          onOptionSelect
        );
      }
    }
    
    // If we couldn't extract items from question text, use a fallback approach:
    // Try to extract matching items from option text patterns (e.g., "A-III, B-IV, C-I, D-II")
    if (options.length > 0 && typeof options[0].option_text === 'string') {
      // Extract the pattern from the first option
      const optionTextPattern = options[0].option_text;
      const pairs = optionTextPattern.split(',').map(pair => pair.trim());
      
      // Create synthetic matching items from the option pattern
      const syntheticItems = pairs.map(pair => {
        const [leftSide, rightSide] = pair.split('-').map(s => s.trim());
        return {
          left_item_label: leftSide,
          left_item_text: `Item ${leftSide}`,
          right_item_label: rightSide,
          right_item_text: `Item ${rightSide}`
        };
      });
      
      // If we created synthetic items, render with them
      if (syntheticItems.length > 0) {
        return renderMatchingQuestion(
          options,
          syntheticItems,
          "Column A",
          "Column B",
          selectedOption,
          onOptionSelect
        );
      }
    }
    
    // If all extraction methods failed, show options-only UI with a notice
    return (
      <div>
        <div className="mb-4 bg-blue-50 dark:bg-blue-900 p-3 rounded-md border border-blue-200 dark:border-blue-700">
          <p className="text-blue-700 dark:text-blue-200">
            This question requires matching items from different columns. Please refer to the question text.
          </p>
        </div>
        
        <div className="space-y-3">
          {options.map((option, index) => (
            <OptionButton
              key={index}
              option={option}
              isSelected={selectedOption === String(option.option_number)}
              onClick={() => onOptionSelect(String(option.option_number))}
            />
          ))}
        </div>
      </div>
    );
  }

  // If we get here, we have valid items from the normalized details
  return renderMatchingQuestion(
    options,
    normalizedDetails.matching_details.items,
    normalizedDetails.matching_details.left_column_header || 'List I',
    normalizedDetails.matching_details.right_column_header || 'List II',
    selectedOption,
    onOptionSelect
  );
}

// Helper types for renderMatchingQuestion
interface RenderOptionType {
  option_number: number | string;
  option_text: string; // Assumed to be present based on usage and for OptionButton
}

interface RenderItemType {
  left_item_label: string;
  left_item_text: string;
  right_item_label: string;
  right_item_text: string;
}

// Helper function to render the matching question UI
function renderMatchingQuestion(
  options: RenderOptionType[],
  items: RenderItemType[],
  leftHeader: string,
  rightHeader: string,
  selectedOption: string | null,
  onOptionSelect: (option: string) => void
) {
  return (
    <div>
      <div className="mb-6 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                {leftHeader}
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                {rightHeader}
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
      <div className="space-y-3">
        {options.map((option, index) => (
          <OptionButton
            key={index}
            option={option}
            isSelected={selectedOption === String(option.option_number)}
            onClick={() => onOptionSelect(String(option.option_number))}
          />
        ))}
      </div>
    </div>
  );
}
