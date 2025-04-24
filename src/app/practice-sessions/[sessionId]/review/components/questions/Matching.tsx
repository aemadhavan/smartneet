import { QuestionAttempt } from '../interfaces';
import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface MatchingProps {
  attempt: QuestionAttempt;
}

interface Item {
  key: string;
  text: string;
}

interface Option {
  key: string;
  text: string;
}

interface Matches {
  [key: string]: string;
}

export default function Matching({ attempt }: MatchingProps) {
  const items: Item[] = attempt.details.items || [];
  const options: Option[] = attempt.details.options || [];
  const userMatches: Matches = attempt.userAnswer?.matches || {};
  const correctMatches: Matches = attempt.correctAnswer?.matches || {};

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

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Item
              </th>
              <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Your Match
              </th>
              <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Correct Match
              </th>
              <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {items.map((item, idx) => {
              const userOption = options.find((o) => o.key === userMatches[item.key]);
              const correctOption = options.find((o) => o.key === correctMatches[item.key]);
              const isItemCorrect = userMatches[item.key] === correctMatches[item.key];

              return (
                <tr
                  key={idx}
                  className={
                    isItemCorrect ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'
                  }
                >
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">{item.text}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        isItemCorrect
                          ? 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {userOption ? userOption.text : 'Not answered'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                      {correctOption ? correctOption.text : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isItemCorrect ? (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                    ) : (
                      <XCircle className="text-red-600 dark:text-red-400" size={18} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
