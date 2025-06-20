import { QuestionAttempt } from './interfaces';
import QuestionContent from './questions';

interface QuestionDisplayProps {
  currentAttempt: QuestionAttempt;
  currentIndex: number;
  totalQuestions: number;
}

export default function QuestionDisplay({ 
  currentAttempt, 
  currentIndex, 
  totalQuestions 
}: QuestionDisplayProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-sm mr-2">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className={`px-2 py-1 rounded-md text-sm ${
            currentAttempt.isCorrect === null
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
              : currentAttempt.isCorrect 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}>
            {currentAttempt.isCorrect === null ? 'Not Answered' : currentAttempt.isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        </div>
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
            {currentAttempt.marksAwarded}/{currentAttempt.maxMarks} marks
          </span>
        </div>
      </div>
      
      <div className="flex items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-md mr-2">
          {currentAttempt.topic.topicName}
        </span>
        {currentAttempt.subtopic && (
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-md">
            {currentAttempt.subtopic.subtopicName}
          </span>
        )}
      </div>
      
      <QuestionContent attempt={currentAttempt} />
    </div>
  );
}