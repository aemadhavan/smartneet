// File: src/app/practice/components/questions/AssertionReasonQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { AssertionReasonDetails } from '@/app/practice/types';

// Define interfaces for the statement and option types
interface Statement {
  statement_label: string;
  statement_text: string;
}

interface OptionItem {
  option_number: string;
  option_text: string;
}

interface AssertionReasonQuestionProps {
  details: {
    statements: Statement[];
    options: OptionItem[];
  };
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function AssertionReasonQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect 
}: AssertionReasonQuestionProps) {
  // Check if details has the expected structure
  if (!details || !Array.isArray(details.statements) || !Array.isArray(details.options)) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <p className="text-yellow-700">Invalid question details format.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-4 border-b pb-4">
        {details.statements.map((statement: Statement, index: number) => (
          <div key={index} className="bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">{statement.statement_label}:</p>
            <p dangerouslySetInnerHTML={{ __html: statement.statement_text }} />
          </div>
        ))}
      </div>
      <div className="space-y-3">
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