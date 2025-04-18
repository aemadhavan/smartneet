// File: src/app/practice/components/questions/MultipleCorrectStatementsQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { MultipleCorrectStatementsDetails } from '@/app/practice/types';

// Define interfaces for the statement and option types
interface Statement {
  statement_label: string;
  statement_text: string;
}

interface OptionItem {
  option_number: string;
  option_text: string;
}

interface MultipleCorrectStatementsQuestionProps {
  details: {
    statements: Statement[];
    options: OptionItem[];
  };
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function MultipleCorrectStatementsQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect 
}: MultipleCorrectStatementsQuestionProps) {
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
      <div className="mb-6 space-y-3 border-b pb-4">
        {details.statements.map((statement: Statement, index: number) => (
          <div key={index} className="bg-gray-50 p-3 rounded">
            <div className="flex">
              <span className="font-medium mr-2">{statement.statement_label}:</span>
              <div dangerouslySetInnerHTML={{ __html: statement.statement_text }} />
            </div>
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