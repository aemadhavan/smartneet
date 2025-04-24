import { QuestionAttempt } from '../interfaces';
import { CheckCircle, XCircle } from 'lucide-react';

interface SequenceOrderingProps {
  attempt: QuestionAttempt;
}

export default function SequenceOrdering({ attempt }: SequenceOrderingProps) {
  const items = attempt.details.items || [];
  const userSequence = attempt.userAnswer?.sequence || [];
  const correctSequence = attempt.correctAnswer?.sequence || [];
  
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
      
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Your Sequence:</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {userSequence.map((itemKey: string, idx: number) => {
            const item = items.find((i: any) => i.key === itemKey);
            const correctPositionIndex = correctSequence.indexOf(itemKey);
            const isCorrectPosition = correctPositionIndex === idx;
            
            return (
              <div
                key={idx}
                className={`relative p-3 rounded-md border-2 ${
                  isCorrectPosition
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                }`}
              >
                <div className="flex items-center">
                  <div className="mr-2 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-200">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{item?.text || `Item ${itemKey}`}</p>
                  <div className="ml-2">
                    {isCorrectPosition ? (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                    ) : (
                      <XCircle className="text-red-600 dark:text-red-400" size={18} />
                    )}
                  </div>
                </div>
                {!isCorrectPosition && (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Correct position: {correctPositionIndex + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Correct Sequence:</h3>
        <div className="flex flex-wrap gap-2">
          {correctSequence.map((itemKey: string, idx: number) => {
            const item = items.find((i: any) => i.key === itemKey);
            
            return (
              <div
                key={idx}
                className="p-3 rounded-md border-2 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
              >
                <div className="flex items-center">
                  <div className="mr-2 w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-800 dark:text-green-200">
                    {idx + 1}
                  </div>
                  <p className="text-green-800 dark:text-green-300">{item?.text || `Item ${itemKey}`}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}