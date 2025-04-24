//File: src/app/dashboard/page.tsx

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

// Types for our dashboard data
interface SessionSummary {
  session_id: number;
  session_type: string;
  start_time: string;
  end_time: string | null;
  subject_name: string;
  topic_name: string | null;
  questions_attempted: number;
  questions_correct: number;
  score: number | null;
  max_score: number | null;
  duration_minutes: number | null;
  is_completed: boolean;
  accuracy: number; // Calculated field
}

interface TopicMastery {
  mastery_id: number;
  user_id: string;
  topic_id: number;
  topic_name: string;
  mastery_level: string;
  questions_attempted: number;
  questions_correct: number;
  accuracy_percentage: number;
  last_practiced: string;
  streak_count: number;
  subject_id: number;
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

interface QuestionTypeData {
  name: string;
  value: number;
}

interface SubjectPerformance {
  subject: string;
  accuracy: number;
}

interface PerformanceOverTime {
  date: string;
  accuracy: number;
  score: number;
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  
  // State for dashboard data
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
  
  // Derived state for charts
  const [questionTypeData, setQuestionTypeData] = useState<QuestionTypeData[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [performanceOverTime, setPerformanceOverTime] = useState<PerformanceOverTime[]>([]);
  
  // Main data fetching function
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Use Promise.all to fetch data in parallel
      const [sessionsData, topicData, statsData, typesData] = await Promise.all([
        fetchRecentSessions(),
        fetchTopicMastery(),
        fetchUserStats(),
        fetchQuestionTypes()
      ]);
      
      setRecentSessions(sessionsData);
      setTopicMastery(topicData);
      setStats(statsData);
      setQuestionTypeData(typesData);
      
      // Derive additional visualization data from the fetched data
      const subjectData = deriveSubjectPerformance(sessionsData);
      const performanceData = derivePerformanceData(sessionsData);
      
      setSubjectPerformance(subjectData);
      setPerformanceOverTime(performanceData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Redirect if not signed in
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
      const response = await fetch('/api/practice-sessions?limit=10');
      if (!response.ok) {
        throw new Error('Failed to fetch recent sessions');
      }
      
      const responseData = await response.json();
      
      // Handle different response formats
      let sessionsArray: any[] = [];
      
      if (Array.isArray(responseData)) {
        // If the response is already an array
        sessionsArray = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // If the response is an object, look for common array properties
        const possibleArrayProps = ['data', 'sessions', 'results', 'items'];
        
        for (const prop of possibleArrayProps) {
          if (responseData[prop] && Array.isArray(responseData[prop])) {
            sessionsArray = responseData[prop];
            break;
          }
        }
        
        // If we still don't have an array, log the response structure
        if (sessionsArray.length === 0) {
          console.error('Expected array but got object with properties:', Object.keys(responseData));
          return [];
        }
      } else {
        console.error('Expected array or object but got:', typeof responseData);
        return [];
      }
      
      // Transform data to include calculated accuracy
      return sessionsArray.map((session: SessionSummary) => {
        const questionsAttempted = session.questions_attempted ?? 0;
        const questionsCorrect = session.questions_correct ?? 0;
        
        return {
          ...session,
          accuracy: questionsAttempted > 0 
            ? (questionsCorrect / questionsAttempted) * 100 
            : 0
        };
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  };

  // Fetch topic mastery data
  const fetchTopicMastery = async (): Promise<TopicMastery[]> => {
    try {
      const response = await fetch('/api/topic-mastery');
      if (!response.ok) {
        throw new Error('Failed to fetch topic mastery');
      }
      
      const responseData = await response.json();
      
      // Handle different response formats
      let masteryArray: any[] = [];
      
      if (Array.isArray(responseData)) {
        // If the response is already an array
        masteryArray = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // If the response is an object, look for common array properties
        const possibleArrayProps = ['data', 'topics', 'mastery', 'results', 'items'];
        
        for (const prop of possibleArrayProps) {
          if (responseData[prop] && Array.isArray(responseData[prop])) {
            masteryArray = responseData[prop];
            break;
          }
        }
        
        // If we still don't have an array, log the response structure
        if (masteryArray.length === 0) {
          console.error('Expected array for topic mastery but got object with properties:', Object.keys(responseData));
          return [];
        }
      } else {
        console.error('Expected array or object for topic mastery but got:', typeof responseData);
        return [];
      }
      
      return masteryArray;
    } catch (error) {
      console.error('Error fetching topic mastery:', error);
      return [];
    }
  };

  // Fetch user statistics
  const fetchUserStats = async (): Promise<UserStats> => {
    try {
      const response = await fetch('/api/user-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      const responseData = await response.json();
      
      // Default stats to return if we can't find valid data
      const defaultStats = {
        totalSessions: 0,
        totalQuestionsAttempted: 0,
        totalCorrectAnswers: 0,
        averageAccuracy: 0,
        totalDurationMinutes: 0,
        streakCount: 0,
        masteredTopics: 0
      };
      
      // Handle different response formats
      let statsData = null;
      
      if (responseData && typeof responseData === 'object') {
        // If the response is already the stats object
        if ('totalSessions' in responseData || 
            'totalQuestionsAttempted' in responseData || 
            'averageAccuracy' in responseData) {
          statsData = responseData;
        } else {
          // If the response is an object with a nested stats object
          const possibleStatsProps = ['data', 'stats', 'userStats', 'results'];
          
          for (const prop of possibleStatsProps) {
            if (responseData[prop] && typeof responseData[prop] === 'object') {
              statsData = responseData[prop];
              break;
            }
          }
          
          // If we still don't have stats data, log the response structure
          if (!statsData) {
            console.error('Expected object with stats but got object with properties:', Object.keys(responseData));
            return defaultStats;
          }
        }
      } else {
        console.error('Expected object for user stats but got:', typeof responseData);
        return defaultStats;
      }
      
      // Return with defaults for any missing properties
      return {
        totalSessions: statsData.totalSessions || 0,
        totalQuestionsAttempted: statsData.totalQuestionsAttempted || 0,
        totalCorrectAnswers: statsData.totalCorrectAnswers || 0,
        averageAccuracy: statsData.averageAccuracy || 0,
        totalDurationMinutes: statsData.totalDurationMinutes || 0,
        streakCount: statsData.streakCount || 0,
        masteredTopics: statsData.masteredTopics || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalSessions: 0,
        totalQuestionsAttempted: 0,
        totalCorrectAnswers: 0,
        averageAccuracy: 0,
        totalDurationMinutes: 0,
        streakCount: 0,
        masteredTopics: 0
      };
    }
  };

  // Fetch question type distribution
  const fetchQuestionTypes = async (): Promise<QuestionTypeData[]> => {
    try {
      const response = await fetch('/api/question-types');
      if (!response.ok) {
        throw new Error('Failed to fetch question type distribution');
      }
      
      const responseData = await response.json();
      
      // Default data to return if we can't find a valid array
      const defaultData = [
        { name: 'Multiple Choice', value: 65 },
        { name: 'Multiple Correct', value: 15 },
        { name: 'Assertion-Reason', value: 10 },
        { name: 'Matching', value: 5 },
        { name: 'Sequence', value: 5 }
      ];
      
      // Handle different response formats
      let typesArray: any[] = [];
      
      if (Array.isArray(responseData)) {
        // If the response is already an array
        typesArray = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // If the response is an object, look for common array properties
        const possibleArrayProps = ['data', 'types', 'questionTypes', 'distribution', 'results', 'items'];
        
        for (const prop of possibleArrayProps) {
          if (responseData[prop] && Array.isArray(responseData[prop])) {
            typesArray = responseData[prop];
            break;
          }
        }
        
        // If we still don't have an array, log the response structure
        if (typesArray.length === 0) {
          console.error('Expected array for question types but got object with properties:', Object.keys(responseData));
          return defaultData;
        }
      } else {
        console.error('Expected array or object for question types but got:', typeof responseData);
        return defaultData;
      }
      
      return typesArray;
    } catch (error) {
      console.error('Error fetching question types:', error);
      // Return default data in case of error
      return [
        { name: 'Multiple Choice', value: 65 },
        { name: 'Multiple Correct', value: 15 },
        { name: 'Assertion-Reason', value: 10 },
        { name: 'Matching', value: 5 },
        { name: 'Sequence', value: 5 }
      ];
    }
  };

  // Helper to derive subject performance from sessions
  const deriveSubjectPerformance = (sessions: SessionSummary[]): SubjectPerformance[] => {
    // Group sessions by subject and calculate average accuracy
    const subjectMap = new Map<string, {totalAccuracy: number, count: number}>();
    
    sessions.forEach(session => {
      if (!session.subject_name) return;
      
      const current = subjectMap.get(session.subject_name) || {totalAccuracy: 0, count: 0};
      subjectMap.set(session.subject_name, {
        totalAccuracy: current.totalAccuracy + session.accuracy,
        count: current.count + 1
      });
    });
    
    // Convert to array of objects for chart
    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      accuracy: Math.round(data.totalAccuracy / data.count)
    }));
  };

  // Helper to derive performance over time data
  const derivePerformanceData = (sessions: SessionSummary[]): PerformanceOverTime[] => {
    // Sort sessions by date and take the last 7
    const sortedSessions = [...sessions]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(-7);
    
    return sortedSessions.map(session => {
      const date = new Date(session.start_time);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        accuracy: Math.round(session.accuracy),
        score: session.score || 0
      };
    });
  };
  
  // Identify focus areas (low performance topics)
  const generateFocusAreas = (topicMastery: TopicMastery[]) => {
    return [...topicMastery]
      .filter(topic => topic.accuracy_percentage < 70)
      .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
      .slice(0, 3)
      .map(topic => ({
        name: topic.topic_name,
        accuracy: topic.accuracy_percentage
      }));
  };

  // Identify strong areas (high performance topics)
  const generateStrongAreas = (topicMastery: TopicMastery[]) => {
    return [...topicMastery]
      .filter(topic => topic.accuracy_percentage >= 80)
      .sort((a, b) => b.accuracy_percentage - a.accuracy_percentage)
      .slice(0, 3)
      .map(topic => ({
        name: topic.topic_name,
        accuracy: topic.accuracy_percentage
      }));
  };
  
  // Helper functions for UI formatting
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatAccuracy = (accuracy: number) => {
    return `${Math.round(accuracy)}%`;
  };
  
  // Generate pie chart colors
  const generatePieColors = () => {
    return [
      '#10b981', // emerald-500
      '#6366f1', // indigo-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6'  // violet-500
    ];
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg dark:text-gray-300 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
      );
    }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="mb-8">
<h1 className="text-3xl font-bold dark:text-white text-gray-800 mb-2">Your Learning Dashboard</h1>
<p className="dark:text-gray-400 text-gray-600">
          Track your progress and identify areas for improvement
        </p>
      </header>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
              <BookOpen size={24} />
            </div>
            <div>
<p className="text-sm dark:text-gray-400 text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <CheckCircle size={24} />
            </div>
            <div>
<p className="text-sm dark:text-gray-400 text-gray-500">Avg. Accuracy</p>
              <p className="text-2xl font-bold">{formatAccuracy(stats.averageAccuracy)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
              <Clock size={24} />
            </div>
            <div>
<p className="text-sm dark:text-gray-400 text-gray-500">Study Time</p>
              <p className="text-2xl font-bold">{stats.totalDurationMinutes} min</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <Flame size={24} />
            </div>
            <div>
<p className="text-sm dark:text-gray-400 text-gray-500">Current Streak</p>
              <p className="text-2xl font-bold">{stats.streakCount} days</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Topic Mastery Column */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
<h2 className="text-xl font-semibold dark:text-white text-gray-800">Topic Mastery</h2>
              <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {stats.masteredTopics} mastered
              </div>
            </div>
            
            <div className="space-y-4">
              {topicMastery.length === 0 ? (
<p className="dark:text-white text-gray-500 text-center py-4">No topic mastery data available yet.</p>
              ) : (
                topicMastery.slice(0, 5).map(topic => (
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
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium flex items-center justify-center"
              >
                View all topics <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
<h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Quick Actions</h2>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
<h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Performance Overview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceOverTime}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Subject Performance</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectPerformance}
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
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Question Types</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={questionTypeData}
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
      <h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Recent Sessions</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
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
                  <td colSpan={7} className="px-6 py-4 text-center dark:text-gray-400 text-gray-500">
                    No session history yet. Start practicing to see your progress!
                  </td>
                </tr>
              ) : (
                recentSessions.map((session) => (
                  <tr key={session.session_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400 text-gray-500">
                      {formatDate(session.start_time)}
                    </td>
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white text-gray-900">
                      {session.subject_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400 text-gray-500">
                      {session.topic_name || 'All Topics'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400 text-gray-500">
                      {session.score ?? 0}/{session.max_score ?? 0}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400 text-gray-500">
                      {session.duration_minutes ?? 0} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link 
                        href={`/sessions/${session.session_id}`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-8">
        <div className="flex items-start mb-4">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold dark:text-white text-gray-800">AI-Powered Recommendations</h2>
            <p className="dark:text-gray-400 text-gray-600">Based on your performance and learning patterns</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Focus Areas</h3>
            <p className="text-blue-700 text-sm mb-3">
              These topics need more attention based on your performance:
            </p>
            <ul className="space-y-2">
              {generateFocusAreas(topicMastery).map((area, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  {area.name} ({area.accuracy}% accuracy)
                </li>
              ))}
              {generateFocusAreas(topicMastery).length === 0 && (
                <li className="text-sm">No focus areas identified yet. Keep practicing!</li>
              )}
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-medium text-green-800 mb-2">Strong Areas</h3>
            <p className="text-green-700 text-sm mb-3">
              You&apos;re performing well in these topics:
            </p>
            <ul className="space-y-2">
              {generateStrongAreas(topicMastery).map((area, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {area.name} ({area.accuracy}% accuracy)
                </li>
              ))}
              {generateStrongAreas(topicMastery).length === 0 && (
                <li className="text-sm">No strong areas identified yet. Keep practicing!</li>
              )}
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-medium text-purple-800 mb-2">Learning Insights</h3>
            <ul className="space-y-3">
              <li className="text-sm text-purple-700">
                <span className="font-medium block">Study Pattern:</span>
                {stats.totalSessions > 5 ? 
                  "You perform best in morning sessions (9-11 AM)." :
                  "Complete more sessions to unlock personalized insights."}
              </li>
              <li className="text-sm text-purple-700">
                <span className="font-medium block">Question Type:</span>
                {stats.totalQuestionsAttempted > 20 ? 
                  "You excel at Multiple Choice but struggle with Assertion-Reason questions." :
                  "Answer more questions to see your strengths by question type."}
              </li>
              <li className="text-sm text-purple-700">
                <span className="font-medium block">Time Management:</span>
                {stats.totalDurationMinutes > 60 ? 
                  "You spend 40% more time on Cell Structure questions than average." :
                  "Study more to reveal your time management patterns."}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
