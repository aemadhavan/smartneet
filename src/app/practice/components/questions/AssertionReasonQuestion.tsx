// File: src/app/practice/components/questions/AssertionReasonQuestion.tsx
import { OptionButton } from '@/app/practice/components/ui';
import { Statement, QuestionOption, AssertionReasonDetails } from '@/app/practice/types';
import { parseJsonDetails, extractStatementsFromText } from '@/app/practice/utils/questionUtils';

interface AssertionReasonQuestionProps {
  details: unknown;
  selectedOption: string | null;
  onOptionSelect: (option: string) => void;
  questionText?: string; // Pass the question text for extracting statements if needed
}

interface ParsedOption {
  option_number?: string;
  optionNumber?: string;
  option_text?: string;
  optionText?: string;
}

export function AssertionReasonQuestion({ 
  details, 
  selectedOption, 
  onOptionSelect,
  questionText = '' 
}: AssertionReasonQuestionProps) {
  // Parse the details if it's a string
  const parsedDetails = parseJsonDetails<Partial<AssertionReasonDetails>>(details as string | Partial<AssertionReasonDetails>);
  
  if (!parsedDetails) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format. Unable to parse JSON.</p>
      </div>
    );
  }
  
  // If there's a proper statements array in the details, use it
  let statements: Statement[] = [];
  if (parsedDetails.statements && Array.isArray(parsedDetails.statements)) {
    statements = parsedDetails.statements;
  } 
  // Otherwise, try to extract statements from the question text
  else if (questionText) {
    statements = extractStatementsFromText(questionText).map(s => ({
      statement_label: s.label,
      statement_text: s.text
    }));
  }
  
  // If we don't have any options, show error
  if (!parsedDetails.options || !Array.isArray(parsedDetails.options) || parsedDetails.options.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-700 dark:text-yellow-200">Invalid question details format. Missing options array.</p>
        <pre className="mt-2 text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-40">
          {JSON.stringify(parsedDetails, null, 2)}
        </pre>
      </div>
    );
  }
  
  // Map the options to the expected format if needed
  const options: QuestionOption[] = parsedDetails.options.map((opt: ParsedOption) => ({
    option_number: opt.option_number || opt.optionNumber || '',
    option_text: opt.option_text || opt.optionText || ''
  }));

  return (
    <div>
      {/* Only render the statements section if we have statements */}
      {statements.length > 0 && (
        <div className="mb-6 space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          {statements.map((statement, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <p className="font-medium mb-1 text-gray-900 dark:text-gray-100">{statement.statement_label}:</p>
              <p className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: statement.statement_text }} />
            </div>
          ))}
        </div>
      )}
      
      <div className="space-y-3">
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