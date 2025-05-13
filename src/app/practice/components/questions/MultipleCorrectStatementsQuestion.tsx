// File: src/app/practice/components/questions/MultipleCorrectStatementsQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { Statement, QuestionOption } from '@/app/practice/types';

interface MultipleCorrectStatementsQuestionProps {
  details: {
    options: QuestionOption[];
    statement_details: {
      intro_text: string | null;
      statements: Statement[] | null;
    };
  };
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
}

export function MultipleCorrectStatementsQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect 
}: MultipleCorrectStatementsQuestionProps) {
  // Make sure we have options to display
  if (!details || !Array.isArray(details.options)) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format: missing options.</p>
      </div>
    );
  }

  // Check if this is a regular MCQ disguised as a MultipleCorrectStatements question
  const isSimpleMCQ = !details.statement_details?.statements || details.statement_details.statements.length === 0;

  return (
    <div>
      {/* Only show statement details if they exist */}
      {!isSimpleMCQ && (
        <>
          {details.statement_details.intro_text && (
            <div className="mb-4">
              <p className="text-gray-800 dark:text-gray-200" 
                dangerouslySetInnerHTML={{ __html: details.statement_details.intro_text }} />
            </div>
          )}
          <div className="mb-6 space-y-3 border-b border-gray-200 dark:border-gray-700 pb-4">
            {details.statement_details.statements?.map((statement, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <div className="flex">
                  <span className="font-medium mr-2 text-gray-900 dark:text-gray-100">
                    {statement.statement_label}:
                  </span>
                  <div className="text-gray-800 dark:text-gray-200" 
                    dangerouslySetInnerHTML={{ __html: statement.statement_text }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Always show the options */}
      <div className="space-y-3">
        {details.options.map((option, index) => (
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
