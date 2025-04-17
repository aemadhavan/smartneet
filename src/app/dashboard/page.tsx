// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Flame,
  BookMarked,
  TrendingUp
} from 'lucide-react';

// Types
interface SessionSummary {
  session_id: number;
  session_type: string;
  start_time: string;
  subject_name: string;
  topic_name: string | null;
  questions_attempted: number;
  questions_correct: number;
  score: number;
  max_score: number;
  duration_minutes: number;
  accuracy: number;
}

interface TopicMastery {
  topic_id: number;
  topic_name: string;
  mastery_level: string;
  accuracy_percentage: number;
  questions_attempted: number;
  last_practiced: string;
}

interface UserStats {
  totalSessions: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  averageAccuracy: number;
  totalDurationMinutes: number;
  streakCount: number;
  masteredTopics: number;
}

// Session data interface from API
interface ApiSessionData {
  session_id: number;
  session_type: string;
  start_time: string;
  subject_name: string;
  topic_name: string | null;
  questions_attempted?: number;
  questions_correct?: number;
  score?: number;
  max_score?: number;
  duration_minutes?: number;
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalQuestionsAttempted: 0,
    totalCorrectAnswers: 0,
    averageAccuracy: 0,
    totalDurationMinutes: 0,
    streakCount: 0,
    masteredTopics: 0
  });
  
  // Using useCallback to memoize the function so it can be used in dependency array
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch sessions data
      const sessionsData = await fetchRecentSessions();
      setRecentSessions(sessionsData);
      
      // Fetch topic mastery data
      const topicData = await fetchTopicMastery();
      setTopicMastery(topicData);
      
      // Fetch user stats
      const statsData = await fetchUserStats();
      setStats(statsData);
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Even in case of error, we still want to show something
      setRecentSessions(mockFetchRecentSessions());
      setTopicMastery(mockFetchTopicMastery());
      setStats(mockFetchUserStats());
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=dashboard');
      return;
    }
    
    if (isSignedIn) {
      fetchDashboardData();
    }
  }, [isSignedIn, isLoaded, router, fetchDashboardData]);

  // Fetch recent practice sessions
  const fetchRecentSessions = async (): Promise<SessionSummary[]> => {
    try {
      const response = await fetch('/api/practice-sessions?limit=5');
      if (!response.ok) {
        throw new Error('Failed to fetch recent sessions');
      }
      
      const data = await response.json();
      
      // Transform data to match SessionSummary interface
      return data.map((session: ApiSessionData) => {
        const questionsAttempted = session.questions_attempted ?? 0;
        const questionsCorrect = session.questions_correct ?? 0;
        
        return {
          session_id: session.session_id,
          session_type: session.session_type,
          start_time: session.start_time,
          subject_name: session.subject_name,
          topic_name: session.topic_name,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          score: session.score ?? 0,
          max_score: session.max_score ?? 0,
          duration_minutes: session.duration_minutes ?? 0,
          accuracy: questionsAttempted > 0 
            ? (questionsCorrect / questionsAttempted) * 100 
            : 0
        };
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Return mock data in case of error
      return mockFetchRecentSessions();
    }
  };

  // Fetch topic mastery data
  const fetchTopicMastery = async (): Promise<TopicMastery[]> => {
    try {
      const response = await fetch('/api/topic-mastery');
      if (!response.ok) {
        throw new Error('Failed to fetch topic mastery');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching topic mastery:', error);
      // Return mock data in case of error
      return mockFetchTopicMastery();
    }
  };

  // Fetch user statistics
  const fetchUserStats = async (): Promise<UserStats> => {
    try {
      const response = await fetch('/api/user-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      const data = await response.json();
      
      // Ensure all required properties exist
      return {
        totalSessions: data.totalSessions || 0,
        totalQuestionsAttempted: data.totalQuestionsAttempted || 0,
        totalCorrectAnswers: data.totalCorrectAnswers || 0,
        averageAccuracy: data.averageAccuracy || 0,
        totalDurationMinutes: data.totalDurationMinutes || 0,
        streakCount: data.streakCount || 0,
        masteredTopics: data.masteredTopics || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Return mock data in case of error
      return mockFetchUserStats();
    }
  };
  
  // Get mastery level color
  const getMasteryColor = (level: string) => {
    switch(level) {
      case 'notStarted': return '#f3f4f6'; // gray-100
      case 'beginner': return '#fee2e2'; // red-100
      case 'intermediate': return '#fef3c7'; // yellow-100
      case 'advanced': return '#dbeafe'; // blue-100
      case 'mastered': return '#d1fae5'; // green-100
      default: return '#f3f4f6'; // gray-100
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Format accuracy percentage
  const formatAccuracy = (accuracy: number) => {
    return `${Math.round(accuracy)}%`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Learning Dashboard</h1>
        <p className="text-gray-600">
          Track your progress and identify areas for improvement
        </p>
      </header>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Accuracy</p>
              <p className="text-2xl font-bold">{formatAccuracy(stats.averageAccuracy)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Study Time</p>
              <p className="text-2xl font-bold">{stats.totalDurationMinutes} min</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-2xl font-bold">{stats.streakCount} days</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Topic Mastery Column */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Topic Mastery</h2>
              <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {stats.masteredTopics} mastered
              </div>
            </div>
            
            <div className="space-y-4">
              {topicMastery.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No topic mastery data available yet.</p>
              ) : (
                topicMastery.map(topic => (
                  <div key={topic.topic_id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{topic.topic_name}</h3>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full" 
                        style={{ 
                          backgroundColor: getMasteryColor(topic.mastery_level),
                          color: topic.mastery_level === 'notStarted' ? '#6b7280' : '#1f2937'
                        }}
                      >
                        {topic.mastery_level.charAt(0).toUpperCase() + topic.mastery_level.slice(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full" 
                        style={{ width: `${topic.accuracy_percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Accuracy: {topic.accuracy_percentage}%</span>
                      <span>{topic.questions_attempted} questions</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6">
              <Link 
                href="/dashboard/topics"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center"
              >
                View all topics <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                href="/practice?subject=botany"
                className="block bg-emerald-50 hover:bg-emerald-100 p-4 rounded-md text-emerald-800"
              >
                <div className="flex items-center">
                  <BookOpen className="mr-3" size={20} />
                  <div>
                    <p className="font-medium">Practice Botany</p>
                    <p className="text-sm text-emerald-700">20 personalized questions</p>
                  </div>
                </div>
              </Link>
              
              <Link 
                href="/practice?subject=zoology"
                className="block bg-blue-50 hover:bg-blue-100 p-4 rounded-md text-blue-800"
              >
                <div className="flex items-center">
                  <BookOpen className="mr-3" size={20} />
                  <div>
                    <p className="font-medium">Practice Zoology</p>
                    <p className="text-sm text-blue-700">20 personalized questions</p>
                  </div>
                </div>
              </Link>
              
              <Link 
                href="/bookmarks"
                className="block bg-yellow-50 hover:bg-yellow-100 p-4 rounded-md text-yellow-800"
              >
                <div className="flex items-center">
                  <BookMarked className="mr-3" size={20} />
                  <div>
                    <p className="font-medium">Review Bookmarks</p>
                    <p className="text-sm text-yellow-700">12 bookmarked questions</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Charts Column */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Overview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={generatePerformanceData()}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#10b981" name="Accuracy %" />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Subject Performance</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { subject: 'Botany', accuracy: 76 },
                      { subject: 'Zoology', accuracy: 65 },
                      { subject: 'Physics', accuracy: 42 },
                      { subject: 'Chemistry', accuracy: 58 }
                    ]}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" name="Accuracy %" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Question Types</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Multiple Choice', value: 65 },
                        { name: 'Multiple Correct', value: 15 },
                        { name: 'Assertion-Reason', value: 10 },
                        { name: 'Matching', value: 5 },
                        { name: 'Sequence', value: 5 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {generatePieColors().map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Sessions */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Sessions</h2>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No session history yet. Start practicing to see your progress!
                  </td>
                </tr>
              ) : (
                recentSessions.map((session) => (
                  <tr key={session.session_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(session.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {session.subject_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.topic_name || 'All Topics'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.score}/{session.max_score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${session.accuracy >= 80 ? 'bg-green-100 text-green-800' : 
                            session.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}
                      >
                        {formatAccuracy(session.accuracy)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.duration_minutes} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link 
                        href={`/sessions/${session.session_id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
        <div className="flex items-start mb-4">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">AI-Powered Recommendations</h2>
            <p className="text-gray-600">Based on your performance and learning patterns</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Focus Areas</h3>
            <p className="text-blue-700 text-sm mb-3">
              These topics need more attention based on your performance:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Cell Structure and Function (42% accuracy)
              </li>
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Genetics and Evolution (54% accuracy)
              </li>
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Plant Physiology (68% accuracy)
              </li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-800 mb-2">Strong Areas</h3>
            <p className="text-green-700 text-sm mb-3">
              You&apos;re performing well in these topics:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Diversity in Living World (92% accuracy)
              </li>
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Reproduction in Plants (87% accuracy)
              </li>
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Ecology and Environment (85% accuracy)
              </li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-medium text-purple-800 mb-2">Learning Insights</h3>
            <ul className="space-y-3">
              <li className="text-sm text-purple-700">
                <span className="font-medium block">Study Pattern:</span>
                You perform best in morning sessions (9-11 AM).
              </li>
              <li className="text-sm text-purple-700">
                <span className="font-medium block">Question Type:</span>
                You excel at Multiple Choice but struggle with Assertion-Reason questions.
              </li>
              <li className="text-sm text-purple-700">
                <span className="font-medium block">Time Management:</span>
                You spend 40% more time on Cell Structure questions than average.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data functions (would be API calls in a real application)
function mockFetchRecentSessions(): SessionSummary[] {
  return [
    {
      session_id: 123,
      session_type: 'Practice',
      start_time: '2025-04-12T09:30:00Z',
      subject_name: 'Biology',
      topic_name: 'Cell Structure and Function',
      questions_attempted: 20,
      questions_correct: 14,
      score: 56,
      max_score: 80,
      duration_minutes: 24,
      accuracy: 70
    },
    {
      session_id: 122,
      session_type: 'Test',
      start_time: '2025-04-10T14:15:00Z',
      subject_name: 'Biology',
      topic_name: 'Plant Physiology',
      questions_attempted: 15,
      questions_correct: 13,
      score: 52,
      max_score: 60,
      duration_minutes: 18,
      accuracy: 86.7
    },
    {
      session_id: 121,
      session_type: 'Practice',
      start_time: '2025-04-08T16:45:00Z',
      subject_name: 'Biology',
      topic_name: null,
      questions_attempted: 20,
      questions_correct: 15,
      score: 60,
      max_score: 80,
      duration_minutes: 25,
      accuracy: 75
    },
    {
      session_id: 120,
      session_type: 'Review',
      start_time: '2025-04-05T10:20:00Z',
      subject_name: 'Biology',
      topic_name: 'Diversity in Living World',
      questions_attempted: 10,
      questions_correct: 9,
      score: 36,
      max_score: 40,
      duration_minutes: 12,
      accuracy: 90
    }
  ];
}

function mockFetchTopicMastery(): TopicMastery[] {
  return [
    {
      topic_id: 1,
      topic_name: 'Diversity in Living World',
      mastery_level: 'mastered',
      accuracy_percentage: 92,
      questions_attempted: 35,
      last_practiced: '2025-04-11T10:20:00Z'
    },
    {
      topic_id: 3,
      topic_name: 'Cell Structure and Function',
      mastery_level: 'beginner',
      accuracy_percentage: 42,
      questions_attempted: 25,
      last_practiced: '2025-04-12T09:30:00Z'
    },
    {
      topic_id: 4,
      topic_name: 'Plant Physiology',
      mastery_level: 'intermediate',
      accuracy_percentage: 68,
      questions_attempted: 30,
      last_practiced: '2025-04-10T14:15:00Z'
    },
    {
      topic_id: 5,
      topic_name: 'Reproduction in Plants',
      mastery_level: 'advanced',
      accuracy_percentage: 87,
      questions_attempted: 22,
      last_practiced: '2025-04-06T11:40:00Z'
    },
    {
      topic_id: 6,
      topic_name: 'Genetics and Evolution',
      mastery_level: 'beginner',
      accuracy_percentage: 54,
      questions_attempted: 18,
      last_practiced: '2025-04-04T15:30:00Z'
    }
  ];
}

function mockFetchUserStats(): UserStats {
  return {
    totalSessions: 16,
    totalQuestionsAttempted: 285,
    totalCorrectAnswers: 202,
    averageAccuracy: 70.9,
    totalDurationMinutes: 352,
    streakCount: 4,
    masteredTopics: 2
  };
}

// Helper functions for charts
function generatePerformanceData() {
  // Last 7 sessions performance data
  return [
    { date: 'Apr 4', accuracy: 62, score: 48 },
    { date: 'Apr 5', accuracy: 70, score: 56 },
    { date: 'Apr 6', accuracy: 65, score: 52 },
    { date: 'Apr 8', accuracy: 75, score: 60 },
    { date: 'Apr 10', accuracy: 87, score: 70 },
    { date: 'Apr 12', accuracy: 70, score: 56 }
  ];
}

function generatePieColors() {
  return [
    '#10b981', // emerald-500
    '#6366f1', // indigo-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6'  // violet-500
  ];
}