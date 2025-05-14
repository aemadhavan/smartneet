import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Define statement interfaces
interface Statement {
  key: string;
  text: string;
  is_correct?: boolean;
}

interface StructuredStatement {
  statement_label: string;
  statement_text: string;
  statement_number: number | string;
  is_correct: boolean;
}

// Create more specific types to avoid using 'any'
type StatementsArray = string[];
interface StatementsAnswerObject {
  selectedStatements?: StatementsArray;
  [key: string]: unknown; // More type-safe than 'any'
}

// Define a more flexible QuestionAttempt interface
interface QuestionAttempt {
  questionText?: string;
  details?: {
    statements?: Statement[] | unknown[];
    statement_details?: {
      intro_text?: string | null;
      statements?: Statement[] | unknown[] | null;
    };
    options?: Array<{
      is_correct: boolean;
      option_text: string;
      option_number: number | string;
    }>;
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: StatementsAnswerObject | string | null;
  correctAnswer?: StatementsAnswerObject | string | null;
}

interface MultipleCorrectProps {
  attempt: QuestionAttempt;
}

// Check if an object is a structured statement
function isStructuredStatement(obj: unknown): obj is StructuredStatement {
  return typeof obj === 'object' && obj !== null && 
         'statement_label' in obj && 
         'statement_text' in obj && 
         'is_correct' in obj;
}

// Normalize statements utility function
function normalizeStatements(rawStatements: unknown): Statement[] {
  // If no statements, return empty array
  if (!rawStatements) return [];
  
  // If rawStatements is already an array of objects with key and text, return it
  if (Array.isArray(rawStatements) && rawStatements.every(s => 
    typeof s === 'object' && s !== null && 'key' in s && 'text' in s)) {
    return rawStatements as Statement[];
  }
  
  // If it's an array of structured statements, convert to Statement format
  if (Array.isArray(rawStatements) && rawStatements.some(isStructuredStatement)) {
    return rawStatements.map(s => {
      if (isStructuredStatement(s)) {
        return {
          key: s.statement_label,
          text: s.statement_text,
          is_correct: s.is_correct
        };
      }
      // Fallback for any non-structured items in the array
      return {
        key: String(s.statement_number || '?'),
        text: String(s.statement_text || s),
        is_correct: Boolean(s.is_correct)
      };
    });
  }
  
  // If it's an array of strings or other types, convert to Statement
  return (Array.isArray(rawStatements) ? rawStatements : []).map((statement, index: number) => ({
    key: String.fromCharCode(65 + index), // A, B, C, etc.
    text: String(statement)
  }));
}

// Helper function to extract selected statements from various formats
function extractSelectedStatements(answer: unknown): string[] {
  if (!answer) return [];
  
  // If answer is already an array, return it
  if (Array.isArray(answer)) return answer;
  
  // If answer is an object with a selectedStatements property
  if (typeof answer === 'object' && answer !== null && 'selectedStatements' in answer) {
    const selectedStatements = (answer as StatementsAnswerObject).selectedStatements;
    return Array.isArray(selectedStatements) ? selectedStatements : [];
  }
  
  // If answer is a string that might be JSON
  if (typeof answer === 'string') {
    try {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null && 'selectedStatements' in parsed) {
        const selectedStatements = parsed.selectedStatements;
        return Array.isArray(selectedStatements) ? selectedStatements : [];
      }
    } catch (e) {
      console.error('Error parsing user answer:', e);
      // Not a valid JSON string, ignore
    }
  }
  
  return [];
}

export default function MultipleCorrect({ attempt }: MultipleCorrectProps) {
  // Check for statements in both locations (direct or under statement_details)
  const rawStatements = attempt?.details?.statement_details?.statements || attempt?.details?.statements || [];
  const statements = normalizeStatements(rawStatements);
  const userSelections = extractSelectedStatements(attempt?.userAnswer);
  const correctSelections = extractSelectedStatements(attempt?.correctAnswer);
  
  // Get intro text if available
  const introText = attempt?.details?.statement_details?.intro_text;
  
  // Render nothing if no attempt data
  if (!attempt) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {attempt.questionText ?? 'No question text available'}
      </div>
      
      {/* Display intro text if available */}
      {introText && (
        <div className="mt-2 text-gray-700 dark:text-gray-300 font-medium">
          {introText}
        </div>
      )}
      
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
      
      {/* Display statements */}
      <div className="space-y-2 mt-4">
        {statements.length === 0 ? (
          <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 rounded-md">
            <p className="text-yellow-800 dark:text-yellow-300">
              No statements available for this question. Please refer to the options below.
            </p>
          </div>
        ) : (
          statements.map((statement, idx) => {
            const userSelected = userSelections.includes(statement.key);
            const shouldBeSelected = correctSelections.includes(statement.key);
            const isCorrectSelection = (userSelected && shouldBeSelected) || (!userSelected && !shouldBeSelected);
            
            return (
              <div 
                key={idx}
                className={`p-3 rounded-md border-2 ${
                  userSelected && shouldBeSelected
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : userSelected && !shouldBeSelected
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    : !userSelected && shouldBeSelected
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      userSelected && shouldBeSelected
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        : userSelected && !shouldBeSelected
                        ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                        : !userSelected && shouldBeSelected
                        ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {statement.key}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      userSelected && shouldBeSelected
                        ? 'text-green-800 dark:text-green-300'
                        : userSelected && !shouldBeSelected
                        ? 'text-red-800 dark:text-red-300'
                        : !userSelected && shouldBeSelected
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {statement.text}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                    {userSelected && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        Selected
                      </span>
                    )}
                    {shouldBeSelected && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Should select
                      </span>
                    )}
                    {isCorrectSelection ? (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                    ) : (
                      <XCircle className="text-red-600 dark:text-red-400" size={20} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Display options */}
      {attempt.details?.options && attempt.details.options.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Answer Options:</h3>
          <div className="space-y-2">
            {attempt.details.options.map((option, idx) => {
              const isCorrect = option.is_correct === true;
              const isSelected = attempt.userAnswer && 
                                (typeof attempt.userAnswer === 'string' 
                                  ? attempt.userAnswer === String(option.option_number)
                                  : false);
              
              return (
                <div 
                  key={idx} 
                  className={`p-3 rounded-md border-2 ${
                    isSelected && isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' :
                    isSelected && !isCorrect ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' :
                    isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' :
                    'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected && isCorrect ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' :
                        isSelected && !isCorrect ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' :
                        isCorrect ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.option_number}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        isSelected && isCorrect ? 'text-green-800 dark:text-green-300' :
                        isSelected && !isCorrect ? 'text-red-800 dark:text-red-300' :
                        isCorrect ? 'text-green-800 dark:text-green-300' :
                        'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.option_text}
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
