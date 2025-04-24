import { QuestionAttempt } from '../interfaces';
import { CheckCircle, XCircle } from 'lucide-react';

interface AssertionReasonProps {
  attempt: QuestionAttempt;
}

export default function AssertionReason({ attempt }: AssertionReasonProps) {
  const userAnswer = attempt.userAnswer?.selection || '';
  const correctAnswer = attempt.correctAnswer?.selection || '';
  
  const options = [
    { key: 'A', text: 'Statement I is True, Statement II is True, Statement II is a correct explanation of Statement I' },
    { key: 'B', text: 'Statement I is True, Statement II is True, Statement II is NOT a correct explanation of Statement I' },
    { key: 'C', text: 'Statement I is True, Statement II is False' },
    { key: 'D', text: 'Statement I is False, Statement II is True' },
    { key: 'E', text: 'Statement I is False, Statement II is False' }
  ];
  
  return (
    <div className="space-y-4">
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {attempt.questionText}
      </div>
      
      {attempt.isImageBased && attempt.imageUrl && (
        <div className="my-4">
          <img 
            src={attempt.imageUrl} 
            alt="Question diagram" 
            className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
          />
        </div>
      )}
      
      <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div className="mb-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Statement I:</span>
          <p className="text-gray-600 dark:text-gray-400 ml-4">{attempt.details.statement1}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Statement II:</span>
          <p className="text-gray-600 dark:text-gray-400 ml-4">{attempt.details.statement2}</p>
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        {options.map((option, idx) => {
          const isUserSelection = userAnswer === option.key;
          const isCorrectOption = correctAnswer === option.key;
          const isCorrectSelection = isUserSelection && isCorrectOption;
          const isIncorrectSelection = isUserSelection && !isCorrectOption;
          
          return (
            <div 
              key={idx}
              className={`p-3 rounded-md border-2 ${
                isCorrectSelection
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : isIncorrectSelection
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                  : isCorrectOption
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCorrectSelection
                      ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                      : isIncorrectSelection
                      ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                      : isCorrectOption
                      ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.key}
                  </div>
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCorrectSelection
                      ? 'text-green-800 dark:text-green-300'
                      : isIncorrectSelection
                      ? 'text-red-800 dark:text-red-300'
                      : isCorrectOption
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.text}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                  {isUserSelection && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      Your answer
                    </span>
                  )}
                  {isCorrectOption && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      Correct answer
                    </span>
                  )}
                  {isCorrectSelection && (
                    <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                  )}
                  {isIncorrectSelection && (
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