import { QuestionAttempt } from '../interfaces';
import { normalizeStatements } from '../helpers';
import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface MultipleCorrectProps {
  attempt: QuestionAttempt;
}

export default function MultipleCorrect({ attempt }: MultipleCorrectProps) {
  const rawStatements = attempt.details.statements || [];
  const statements = normalizeStatements(rawStatements);
  const userSelections = attempt.userAnswer?.selectedStatements || [];
  const correctSelections = attempt.correctAnswer?.selectedStatements || [];
  
  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {attempt.questionText}
      </div>
      
      {attempt.isImageBased && attempt.imageUrl && (
        <div className="my-4">
          <Image
            src={attempt.imageUrl}
            alt="Question diagram"
            className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            width={500} // Specify the width
            height={300} // Specify the height
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
