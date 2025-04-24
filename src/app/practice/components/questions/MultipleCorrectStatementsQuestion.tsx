// File: src/app/practice/components/questions/MultipleCorrectStatementsQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { Statement, QuestionOption } from '@/app/practice/types';

interface MultipleCorrectStatementsQuestionProps {
  details: {
    statements: Statement[];
    options: QuestionOption[];
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
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        {details.statements.map((statement, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <div className="flex">
              <span className="font-medium mr-2 text-gray-900 dark:text-gray-100">{statement.statement_label}:</span>
              <div className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: statement.statement_text }} />
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