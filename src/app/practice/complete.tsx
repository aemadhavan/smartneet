'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  BookOpen,
  BarChart
} from 'lucide-react';

interface SessionSummary {
  sessionId: number;
  totalQuestions: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  accuracy: number;
  timeTakenMinutes: number;
  score: number;
  maxScore: number;
  topicPerformance: {
    topicId: number;
    topicName: string;
    questionsCorrect: number;
    questionsTotal: number;
    accuracy: number;
  }[];
}

interface ClockProps {
  size?: number;
  className?: string;
}

export default function SessionCompletePage({ 
  sessionId, 
  onStartNewSession 
}: { 
  sessionId: number; 
  onStartNewSession: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch session summary
    const fetchSummary = async () => {
      try {
        setLoading(true);
        
        // In development/demo mode, skip the actual API call and use mock data
        // In production, you would uncomment this code once the API is implemented
        /*
        const response = await fetch(`/api/practice-sessions/${sessionId}/summary`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch session summary');
        }
        
        const data = await response.json();
        setSummary(data);
        */
        
        // Mock data for demonstration purposes
        const mockSummary: SessionSummary = {
          sessionId,
          totalQuestions: 10,
          questionsCorrect: 7,
          questionsIncorrect: 3,
          accuracy: 70,
          timeTakenMinutes: 12,
          score: 28,
          maxScore: 40,
          topicPerformance: [
            {
              topicId: 1,
              topicName: 'Diversity in Living World',
              questionsCorrect: 3,
              questionsTotal: 3,
              accuracy: 100
            },
            {
              topicId: 3,
              topicName: 'Cell Structure and Function',
              questionsCorrect: 1,
              questionsTotal: 2,
              accuracy: 50
            },
            {
              topicId: 4,
              topicName: 'Biological Classification',
              questionsCorrect: 2,
              questionsTotal: 3,
              accuracy: 67
            },
            {
              topicId: 6,
              topicName: 'Neural Control & Coordination',
              questionsCorrect: 1,
              questionsTotal: 2,
              accuracy: 50
            }
          ]
        };
        
        setSummary(mockSummary);
        setLoading(false);
        
        // In a real app, we'd also send a request to mark the session as completed
        // This code would also need to be uncommented once the API is implemented
        /*
        const markComplete = await fetch(`/api/practice-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_completed: true,
            end_time: new Date().toISOString(),
            questions_correct: mockSummary.questionsCorrect,
            score: mockSummary.score,
            max_score: mockSummary.maxScore
          }),
        });
        */
        
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError('Failed to load session summary. Please try again.');
        setLoading(false);
      }
    };

    fetchSummary();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8"></div>
        <p className="text-gray-600 text-lg">Loading session results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-red-500 mb-6">
          <XCircle size={64} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <div className="flex space-x-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-8 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Practice Session Complete!</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          You&apos;ve completed all questions in this session. Here&apos;s how you did:
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Session Summary</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-1">Score</p>
              <p className="text-3xl font-bold text-indigo-600">{summary.score}/{summary.maxScore}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-1">Accuracy</p>
              <p className="text-3xl font-bold text-emerald-600">{summary.accuracy}%</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-1">Correct</p>
              <p className="text-3xl font-bold text-green-600">{summary.questionsCorrect}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-1">Incorrect</p>
              <p className="text-3xl font-bold text-red-600">{summary.questionsIncorrect}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-center text-blue-800 mb-2">
              <Clock size={18} className="mr-2" />
              <p className="font-medium">Time Taken</p>
            </div>
            <p className="text-blue-600">
              {summary.timeTakenMinutes} minutes
              <span className="text-sm text-blue-500 ml-2">
                (~{Math.round(summary.timeTakenMinutes * 60 / summary.totalQuestions)} seconds per question)
              </span>
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Topic Performance</h2>
          
          <div className="space-y-4">
            {summary.topicPerformance.map((topic) => (
              <div key={topic.topicId} className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{topic.topicName}</h3>
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      topic.accuracy >= 80 ? 'bg-green-100 text-green-800' : 
                      topic.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {topic.accuracy}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      topic.accuracy >= 80 ? 'bg-green-600' : 
                      topic.accuracy >= 60 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${topic.accuracy}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {topic.questionsCorrect} of {topic.questionsTotal} correct
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Recommendations</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
            <h3 className="font-medium text-indigo-800 mb-2">Strengths</h3>
            <p className="text-indigo-700 text-sm mb-3">
              You performed well in these topics:
            </p>
            <ul className="space-y-2">
              {summary.topicPerformance
                .filter(topic => topic.accuracy >= 80)
                .map(topic => (
                  <li key={topic.topicId} className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {topic.topicName} ({topic.accuracy}%)
                  </li>
                ))}
              {summary.topicPerformance.filter(topic => topic.accuracy >= 80).length === 0 && (
                <li className="text-sm text-indigo-600">No strengths identified yet. Keep practicing!</li>
              )}
            </ul>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
            <h3 className="font-medium text-amber-800 mb-2">Areas for Improvement</h3>
            <p className="text-amber-700 text-sm mb-3">
              Focus more on these topics:
            </p>
            <ul className="space-y-2">
              {summary.topicPerformance
                .filter(topic => topic.accuracy < 70)
                .map(topic => (
                  <li key={topic.topicId} className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {topic.topicName} ({topic.accuracy}%)
                  </li>
                ))}
              {summary.topicPerformance.filter(topic => topic.accuracy < 70).length === 0 && (
                <li className="text-sm text-amber-600">Great job! No major areas of concern.</li>
              )}
            </ul>
          </div>
          
          <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800 mb-2">Next Steps</h3>
            <p className="text-purple-700 text-sm mb-3">
              Based on your performance, we recommend:
            </p>
            <ul className="space-y-2">
              {summary.topicPerformance.some(topic => topic.accuracy < 70) ? (
                <li className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Focus on topics with lower scores
                </li>
              ) : null}
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Review incorrect answers
              </li>
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Take another practice session
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4">
        <Link 
          href={`/practice-sessions/${sessionId}/review`}
          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-200 flex items-center"
        >
          <BookOpen size={18} className="mr-2" />
          Review Answers
        </Link>
        
        <button 
          onClick={onStartNewSession}
          className="bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition duration-200 flex items-center"
        >
          <RotateCcw size={18} className="mr-2" />
          New Practice Session
        </button>
        
        <Link 
          href="/dashboard"
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition duration-200 flex items-center"
        >
          <BarChart size={18} className="mr-2" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// Clock component with proper typing
function Clock(props: ClockProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || 24} 
      height={props.size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}