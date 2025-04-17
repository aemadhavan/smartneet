// src/app/sessions/[sessionId]/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Award,
} from 'lucide-react';

// Types
interface SessionResult {
  session_id: number;
  session_type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  subject_name: string;
  topic_name: string | null;
  subtopic_name: string | null;
  total_questions: number;
  questions_attempted: number;
  questions_correct: number;
  score: number;
  max_score: number;
  accuracy: number;
}

interface QuestionResult {
  question_id: number;
  topic_id: number;
  question_text: string;
  question_type: string;
  topic_name: string;
  subtopic_name: string | null;
  is_correct: boolean;
  time_taken_seconds: number;
  user_answer: unknown;
  correct_answer: unknown;
  explanation: string | null;
  marks_awarded: number;
  marks_available: number;
  is_bookmarked: boolean;
}

interface TopicPerformance {
  topic_id: number;
  topic_name: string;
  questions_count: number;
  correct_count: number;
  accuracy: number;
}

// Mock data function for development
function mockSessionResults(): { session: SessionResult; questions: QuestionResult[] } {
  // (Same as provided in the original code)
  return {
    session: {
      session_id: 123,
      session_type: "Practice",
      start_time: "2025-04-10T14:30:00Z",
      end_time: "2025-04-10T15:15:00Z",
      duration_minutes: 45,
      subject_name: "Biology",
      topic_name: "Cell Structure and Function",
      subtopic_name: null,
      total_questions: 20,
      questions_attempted: 18,
      questions_correct: 14,
      score: 56,
      max_score: 80,
      accuracy: 77.78,
    },
    questions: [
      // (Same as provided in the original code)
    ],
  };
}

export default function SessionResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionResult | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([]);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'questions' | 'topics'>('summary');

  useEffect(() => {
    const loadData = async () => {
      if (isLoaded && !isSignedIn) {
        const sessionId = (await params).sessionId;
        router.push('/sign-in?redirect=/sessions/' + sessionId);
        return;
      }
      if (isSignedIn) {
        fetchSessionResults();
      }
    };
    loadData();
  }, [isSignedIn, isLoaded, router, params]);

  const fetchSessionResults = async () => {
    setLoading(true);
    try {
      // In a real implementation, fetch from API
      // const sessionId = (await params).sessionId;
      // const response = await fetch(`/api/sessions/${sessionId}`);
      // if (!response.ok) {
      //   throw new Error('Failed to fetch session results');
      // }
      // const data = await response.json();
      // Mock data for development
      const mockData = mockSessionResults();
      setSessionData(mockData.session);
      setQuestionResults(mockData.questions);

      // Calculate topic performance from question results
      const topicMap = new Map<number, { topic_name: string; questions_count: number; correct_count: number }>();
      mockData.questions.forEach((q) => {
        const topicId = q.topic_id || 0;
        if (!topicMap.has(topicId)) {
          topicMap.set(topicId, { topic_name: q.topic_name, questions_count: 0, correct_count: 0 });
        }
        const topic = topicMap.get(topicId)!;
        topic.questions_count++;
        if (q.is_correct) {
          topic.correct_count++;
        }
      });

      const topicPerformanceData = Array.from(topicMap.entries()).map(([topicId, data]) => ({
        topic_id: topicId,
        topic_name: data.topic_name,
        questions_count: data.questions_count,
        correct_count: data.correct_count,
        accuracy: data.questions_count > 0 ? (data.correct_count / data.questions_count) * 100 : 0,
      }));
      setTopicPerformance(topicPerformanceData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch session results:", error);
      // Use mock data even in case of error
      const mockData = mockSessionResults();
      setSessionData(mockData.session);
      setQuestionResults(mockData.questions);
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format time in seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format accuracy percentage
  const formatAccuracy = (accuracy: number) => {
    return `${Math.round(accuracy)}%`;
  };

  // Get accuracy color based on percentage
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-emerald-600';
    if (accuracy >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  // Get text color based on correctness
  const getCorrectColor = (isCorrect: boolean) => {
    return isCorrect ? 'text-emerald-600' : 'text-red-600';
  };

  // Helper function to render answer based on question type
  const renderAnswer = (questionType: string, answer: unknown): string => {
    if (!answer) return 'No answer provided';
    try {
      switch (questionType) {
        case 'MultipleChoice':
          return typeof answer === 'number' ? `Option ${answer + 1}` : `Option ${answer}`;
        case 'MultipleCorrectStatements':
          if (Array.isArray(answer)) {
            return answer.map((a) => `Option ${a + 1}`).join(', ');
          }
          return String(answer);
        case 'Matching':
          if (typeof answer === 'object' && answer !== null) {
            return Object.entries(answer)
              .map(([key, val]) => `${key} → ${val}`)
              .join(', ');
          }
          return String(answer);
        case 'AssertionReason':
          return String(answer);
        default:
          return String(answer);
      }
    } catch (e) {
      console.error('Error rendering answer:', e);
      return 'Answer format error';
    }
  };

  // Generate colors for charts
  const chartColors = {
    correct: '#10b981', // emerald-500
    incorrect: '#ef4444', // red-500
    skipped: '#9ca3af', // gray-400
    topicColors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading session results...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 bg-red-100 flex items-center justify-center rounded-full mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Session Not Found</h3>
          <p className="text-gray-600 mb-6">
            The practice session you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const summaryStats = {
    correct: sessionData.questions_correct,
    incorrect: sessionData.questions_attempted - sessionData.questions_correct,
    skipped: sessionData.total_questions - sessionData.questions_attempted,
    accuracy:
      sessionData.questions_correct > 0 && sessionData.questions_attempted > 0
        ? (sessionData.questions_correct / sessionData.questions_attempted) * 100
        : 0,
    avgTimePerQuestion:
      questionResults.length > 0
        ? questionResults.reduce((sum, q) => sum + q.time_taken_seconds, 0) / questionResults.length
        : 0,
  };

  // Prepare data for charts
  const pieChartData = [
    { name: 'Correct', value: summaryStats.correct },
    { name: 'Incorrect', value: summaryStats.incorrect },
    { name: 'Skipped', value: summaryStats.skipped },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 p-2 rounded-md"
              >
                <ArrowLeft size={20} />
              </Link>
              <span className="ml-2 text-lg font-medium text-gray-900">Session Results</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">{sessionData.session_type} Session</span>
              <span className="text-sm text-gray-500">|</span>
              <span className="text-sm text-gray-500">
                {sessionData.subject_name}
                {sessionData.topic_name && ` - ${sessionData.topic_name}`}
              </span>
              <span className="text-sm text-gray-500">|</span>
              <span className="text-sm text-gray-500">{formatDate(sessionData.start_time)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Session Summary Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Performance</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-700 text-sm font-medium">Score</p>
                    <p className="text-2xl font-bold text-indigo-900">
                      {sessionData.score}/{sessionData.max_score}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Award size={24} className="text-indigo-600" />
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-700 text-sm font-medium">Accuracy</p>
                    <p className={`text-2xl font-bold ${getAccuracyColor(summaryStats.accuracy)}`}>
                      {formatAccuracy(summaryStats.accuracy)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <CheckCircle size={24} className="text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-700 text-sm font-medium">Avg Time per Question</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {formatTime(Math.round(summaryStats.avgTimePerQuestion))}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-full">
                    <Clock size={24} className="text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">Total Questions</p>
                    <p className="text-2xl font-bold text-gray-900">{sessionData.total_questions}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <BookOpen size={24} className="text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'Correct'
                            ? chartColors.correct
                            : entry.name === 'Incorrect'
                            ? chartColors.incorrect
                            : chartColors.skipped
                        }
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b border-gray-200 mb-6">
              <button
                onClick={() => setSelectedTab('summary')}
                className={`pb-2 font-medium ${
                  selectedTab === 'summary'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setSelectedTab('questions')}
                className={`pb-2 font-medium ${
                  selectedTab === 'questions'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Questions
              </button>
              <button
                onClick={() => setSelectedTab('topics')}
                className={`pb-2 font-medium ${
                  selectedTab === 'topics'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Topics
              </button>
            </div>

            {/* Tab Content */}
            {selectedTab === 'summary' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
                <p className="text-gray-700">
                  You attempted {sessionData.questions_attempted} out of{' '}
                  {sessionData.total_questions} questions and got{' '}
                  {sessionData.questions_correct} correct.
                </p>
              </div>
            )}

            {selectedTab === 'questions' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Questions</h2>
                <div className="space-y-4">
                  {questionResults.map((q) => (
                    <div
                      key={q.question_id}
                      className="bg-white p-4 rounded-lg shadow-sm"
                    >
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {q.question_text}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Type: {q.question_type} | Topic: {q.topic_name}
                      </p>
                      <p className={`text-base font-medium ${getCorrectColor(q.is_correct)}`}>
                        Your Answer: {renderAnswer(q.question_type, q.user_answer)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Time Taken: {formatTime(q.time_taken_seconds)}
                      </p>
                      {q.explanation && (
                        <p className="text-sm text-gray-700 mt-2">
                          Explanation: {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'topics' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Topic Performance</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topicPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="questions_count"
                      fill="#3b82f6"
                      name="Total Questions"
                    />
                    <Bar
                      dataKey="correct_count"
                      fill="#10b981"
                      name="Correct Answers"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
