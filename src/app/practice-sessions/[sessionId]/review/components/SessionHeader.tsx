import Link from 'next/link';
import { Home, BarChart, CheckCircle, BookOpen } from 'lucide-react';
import { SessionSummary } from './interfaces';

interface SessionHeaderProps {
  sessionId: number;
  sessionSummary: SessionSummary | null;
}

export default function SessionHeader({ sessionId, sessionSummary }: SessionHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center">
            <Home size={16} className="mr-1" />
            Dashboard
          </Link>
        </div>
        <div>
          <Link href={`/practice-sessions/${sessionId}/summary`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center">
            <BarChart size={16} className="mr-1" />
            Session Summary
          </Link>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Review Session</h1>
      {sessionSummary && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span className="inline-flex items-center">
            <CheckCircle size={16} className="mr-1 text-green-600 dark:text-green-400" />
            Score: {sessionSummary.score}/{sessionSummary.maxScore}
          </span>
          <span className="inline-flex items-center">
            <BookOpen size={16} className="mr-1 text-blue-600 dark:text-blue-400" />
            Questions: {sessionSummary.questionsCorrect}/{sessionSummary.totalQuestions} correct
          </span>
          <span className="inline-flex items-center">
            <div className={`w-3 h-3 rounded-full mr-1 ${
              sessionSummary.accuracy >= 80 
                ? 'bg-green-500 dark:bg-green-400' 
                : sessionSummary.accuracy >= 60 
                ? 'bg-yellow-500 dark:bg-yellow-400' 
                : 'bg-red-500 dark:bg-red-400'
            }`}></div>
            Accuracy: {sessionSummary.accuracy}%
          </span>
        </div>
      )}
    </header>
  );
}