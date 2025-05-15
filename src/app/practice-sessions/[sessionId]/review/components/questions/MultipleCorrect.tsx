// MultipleCorrect.tsx
import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface Statement {
  key: string;
  text: string;
  isCorrect: boolean;
}

interface Option {
  key: string;
  text: string;
  isCorrect: boolean;
}

interface MultipleCorrectAttempt {
  questionText?: string;
  details?: {
    options?: Array<{
      is_correct?: boolean;
      isCorrect?: boolean;
      option_text?: string;
      option_number?: string | number;
      text?: string;
      key?: string;
    }>;
    statement_details?: {
      statements?: Array<{
        is_correct?: boolean;
        isCorrect?: boolean;
        statement_text?: string;
        statement_label?: string;
        statement_number?: number;
      }>;
      intro_text?: string;
    };
    statements?: Array<{
      key?: string;
      text?: string;
      isCorrect?: boolean;
      is_correct?: boolean;
    }>;
  } | null;
  isImageBased?: boolean;
  imageUrl?: string;
  userAnswer?: string | object | string[];   // Flexible type to handle various formats
  correctAnswer?: string | object | string[]; // Flexible type to handle various formats
}

export default function MultipleCorrect({ attempt }: { attempt: MultipleCorrectAttempt }) {
  if (!attempt) return null;

  // Extract user selected option
  const getUserSelectedOption = (userAnswer: string | object | string[] | null | undefined): string => {
    if (!userAnswer) return '';
    
    // Direct string option number
    if (typeof userAnswer === 'string' && /^\d+$/.test(userAnswer)) {
      return userAnswer;
    }
    
    // Object with selection property
    if (typeof userAnswer === 'object' && userAnswer !== null) {
      if ('selection' in userAnswer) return String((userAnswer as { selection?: string }).selection || '');
      if ('selectedOption' in userAnswer) return String((userAnswer as { selectedOption?: string }).selectedOption || '');
      if ('option' in userAnswer) return String((userAnswer as { option?: string }).option || '');
    }
    
    // Might be a JSON string
    if (typeof userAnswer === 'string' && userAnswer.startsWith('{')) {
      try {
        const parsed = JSON.parse(userAnswer);
        if ('selection' in parsed) return String((parsed as { selection?: string }).selection || '');
        if ('selectedOption' in parsed) return String((parsed as { selectedOption?: string }).selectedOption || '');
        if ('option' in parsed) return String((parsed as { option?: string }).option || '');
      } catch {
        // Not JSON or invalid JSON
      }
    }
    
    return '';
  };

  // Extract user selected statements (for direct statement selection mode)
  const getUserSelectedStatements = (userAnswer: string | object | string[] | null | undefined): string[] => {
    if (!userAnswer) return [];
    
    // Direct array of statement keys
    if (Array.isArray(userAnswer)) {
      return userAnswer.map(String);
    }
    
    // Object with selectedStatements property
    if (typeof userAnswer === 'object' && userAnswer !== null && 'selectedStatements' in userAnswer) {
      const selectedStatements = (userAnswer as { selectedStatements?: string[] }).selectedStatements;
      return Array.isArray(selectedStatements) ? 
        selectedStatements.map(String) : [];
    }
    
    // Might be a JSON string
    if (typeof userAnswer === 'string' && (userAnswer.startsWith('[') || userAnswer.startsWith('{'))) {
      try {
        const parsed = JSON.parse(userAnswer);
        if (Array.isArray(parsed)) {
          return parsed.map(String);
        }
        if (typeof parsed === 'object' && parsed !== null && 'selectedStatements' in parsed) {
          const selectedStatements = (parsed as { selectedStatements?: string[] }).selectedStatements;
          return Array.isArray(selectedStatements) ? 
            selectedStatements.map(String) : [];
        }
      } catch {
        // Not JSON or invalid JSON
      }
    }
    
    return [];
  };

  // Process statements from the appropriate source
  let statements: Statement[] = [];
  if (attempt.details?.statement_details?.statements) {
    statements = attempt.details.statement_details.statements.map(stmt => ({
      key: stmt.statement_label || '',
      text: stmt.statement_text || '',
      isCorrect: stmt.is_correct || stmt.isCorrect || false
    }));
  } else if (attempt.details?.statements) {
    statements = attempt.details.statements.map(stmt => ({
      key: stmt.key || '',
      text: stmt.text || '',
      isCorrect: stmt.isCorrect || stmt.is_correct || false
    }));
  }

  // Process options
  const options: Option[] = (attempt.details?.options || []).map(opt => ({
    key: String(opt.option_number || opt.key || ''),
    text: opt.option_text || opt.text || '',
    isCorrect: opt.is_correct || opt.isCorrect || false
  }));

  // Get the user's selected option and the correct option
  const userSelectedOption = getUserSelectedOption(attempt.userAnswer);
  
  // For statement-based selection, get individual statement selection
  const userSelectedStatements = getUserSelectedStatements(attempt.userAnswer);
  
  // Determine display mode: show both statements and options
  const showStatements = statements.length > 0;
  const showOptions = options.length > 0;
  
  // For multiple correct statements, we might have text like "B and D only" as the option
  // Let's try to extract which statements are mentioned in each option
  const parseOptionText = (optionText: string): string[] => {
    // Look for patterns like "A, B and C only" or "B and D only"
    const matches = optionText.match(/([A-Z](?:,\s*[A-Z])*\s+and\s+[A-Z])/i);
    if (matches) {
      // Extract individual letters
      const letterMatches = optionText.match(/[A-Z]/g);
      return letterMatches || [];
    }
    return [];
  };
  
  // Find which statements are mentioned in the user's selected option
  const userSelectedOptionObj = options.find(opt => opt.key === userSelectedOption);
  const statementsInUserSelection = userSelectedOptionObj ? 
    parseOptionText(userSelectedOptionObj.text) : [];

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {attempt.questionText || 'No question text available'}
      </div>
      
      {attempt.isImageBased && attempt.imageUrl && (
        <div className="my-4">
          <Image
            src={attempt.imageUrl}
            alt="Question diagram"
            className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            width={500}
            height={300}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      )}
      
      {/* Display statements if available */}
      {showStatements && (
        <div className="mt-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Statements:</h3>
          <div className="space-y-2">
            {statements.map((statement, idx) => {
              // Check if this statement is selected directly or through option
              const isSelected = userSelectedStatements.includes(statement.key) || 
                               statementsInUserSelection.includes(statement.key);
              const isCorrect = statement.isCorrect;
              
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-md border-2 ${
                    isSelected && isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                      : isSelected && !isCorrect 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                      : isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected && isCorrect 
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                          : isSelected && !isCorrect 
                          ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' 
                          : isCorrect 
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {statement.key}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        isSelected && isCorrect 
                          ? 'text-green-800 dark:text-green-300' 
                          : isSelected && !isCorrect 
                          ? 'text-red-800 dark:text-red-300' 
                          : isCorrect 
                          ? 'text-green-800 dark:text-green-300' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {statement.text}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                      {isCorrect && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Correct
                        </span>
                      )}
                      {isSelected && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Display your selection section */}
      {showOptions && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Your Selection:</h3>
          <div className="space-y-2">
            {options.map((option, idx) => {
              const isSelected = userSelectedOption === option.key;
              const isCorrect = option.isCorrect;
              
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-md border-2 ${
                    isSelected && isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                      : isSelected && !isCorrect 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                      : isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected && isCorrect 
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                          : isSelected && !isCorrect 
                          ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' 
                          : isCorrect 
                          ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.key}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        isSelected && isCorrect 
                          ? 'text-green-800 dark:text-green-300' 
                          : isSelected && !isCorrect 
                          ? 'text-red-800 dark:text-red-300' 
                          : isCorrect 
                          ? 'text-green-800 dark:text-green-300' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.text}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                      {isSelected && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                          Your answer
                        </span>
                      )}
                      {isCorrect && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Correct answer
                        </span>
                      )}
                      {isSelected && isCorrect && (
                        <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                      )}
                      {isSelected && !isCorrect && (
                        <XCircle className="text-red-600 dark:text-red-400" size={20} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
