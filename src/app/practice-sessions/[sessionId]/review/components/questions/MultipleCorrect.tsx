import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Define statement interface
interface Statement {
  key: string;
  text: string;
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
  } | null;
  isImageBased?: boolean | null | undefined;
  imageUrl?: string | null | undefined;
  userAnswer?: StatementsAnswerObject | string | null;
  correctAnswer?: StatementsAnswerObject | string | null;
}

interface MultipleCorrectProps {
  attempt: QuestionAttempt;
}

// Normalize statements utility function
function normalizeStatements(rawStatements: unknown): Statement[] {
  // If rawStatements is already an array of objects with key and text, return it
  if (Array.isArray(rawStatements) && rawStatements.every(s => 
    typeof s === 'object' && s !== null && 'key' in s && 'text' in s)) {
    return rawStatements as Statement[];
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
  // Add null checks for all potentially undefined properties
  const rawStatements = attempt?.details?.statements ?? [];
  const statements = normalizeStatements(rawStatements);
  const userSelections = extractSelectedStatements(attempt?.userAnswer);
  const correctSelections = extractSelectedStatements(attempt?.correctAnswer);
  
  // Render nothing if no attempt data
  if (!attempt) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {attempt.questionText ?? 'No question text available'}
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
      
      <div className="space-y-2 mt-4">
        {statements.map((statement, idx) => {
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
        })}
      </div>
    </div>
  );
}