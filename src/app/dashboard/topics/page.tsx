// src/app/dashboard/topics/page.tsx
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
} from 'recharts';
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  Clock, 
  Star,
  Book,
  ChevronRight
} from 'lucide-react';

// Types for topic page
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
  subject_name: string;
}

interface SubjectInfo {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  topic_count: number;
  mastered_topics: number;
}

interface TopicStatsSummary {
  totalTopics: number;
  masteredTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  averageAccuracy: number;
  strongestSubject: string;
  weakestSubject: string;
}

interface PerformanceData {
  name: string;
  accuracy: number;
}

export default function TopicsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  
  // State for topics page
  const [loading, setLoading] = useState(true);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [stats, setStats] = useState<TopicStatsSummary>({
    totalTopics: 0,
    masteredTopics: 0,
    inProgressTopics: 0,
    notStartedTopics: 0,
    averageAccuracy: 0,
    strongestSubject: '',
    weakestSubject: ''
  });
  
  // Filter state
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [filterMastery, setFilterMastery] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('mastery'); // mastery, accuracy, name
  
  // Define fetchDashboardData using useCallback to avoid dependency issues
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Use Promise.all to fetch data in parallel
      const [masteryData, subjectData] = await Promise.all([
        fetchTopicMastery(),
        fetchSubjects()
      ]);
      
      setTopicMastery(masteryData);
      setSubjects(subjectData);
      
      // Calculate summary statistics
      calculateStats(masteryData);
    } catch (error) {
      console.error("Failed to fetch topics data:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=dashboard/topics');
      return;
    }
    
    if (isSignedIn) {
      fetchDashboardData();
    }
  }, [isSignedIn, isLoaded, router, fetchDashboardData]);
  
  // Fetch topic mastery data
  const fetchTopicMastery = async (): Promise<TopicMastery[]> => {
    try {
      const response = await fetch('/api/topic-mastery/detailed');
      if (!response.ok) {
        throw new Error('Failed to fetch topic mastery');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching topic mastery:', error);
      return [];
    }
  };

  // Fetch subjects with topic counts
  const fetchSubjects = async (): Promise<SubjectInfo[]> => {
    try {
      const response = await fetch('/api/subjects/with-topics');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  };

  // Calculate summary statistics
  const calculateStats = (topics: TopicMastery[]) => {
    const masteredCount = topics.filter(t => t.mastery_level === 'mastered').length;
    const inProgressCount = topics.filter(t => ['beginner', 'intermediate', 'advanced'].includes(t.mastery_level)).length;
    const notStartedCount = topics.filter(t => t.mastery_level === 'notStarted').length;
    
    // Calculate average accuracy
    const totalAccuracy = topics.reduce((sum, topic) => {
      return sum + (topic.accuracy_percentage || 0);
    }, 0);
    const avgAccuracy = topics.length ? totalAccuracy / topics.length : 0;
    
    // Determine strongest and weakest subjects
    const subjectPerformance = new Map<string, { total: number, count: number }>();
    
    topics.forEach(topic => {
      const subjectName = topic.subject_name;
      if (!subjectName) return;
      
      const current = subjectPerformance.get(subjectName) || { total: 0, count: 0 };
      if (topic.accuracy_percentage) {
        subjectPerformance.set(subjectName, {
          total: current.total + topic.accuracy_percentage,
          count: current.count + 1
        });
      }
    });
    
    let strongestSubject = '';
    let weakestSubject = '';
    let highestAccuracy = 0;
    let lowestAccuracy = 100;
    
    subjectPerformance.forEach((data, subject) => {
      if (data.count) {
        const avgSubjectAccuracy = data.total / data.count;
        if (avgSubjectAccuracy > highestAccuracy) {
          highestAccuracy = avgSubjectAccuracy;
          strongestSubject = subject;
        }
        if (avgSubjectAccuracy < lowestAccuracy) {
          lowestAccuracy = avgSubjectAccuracy;
          weakestSubject = subject;
        }
      }
    });
    
    setStats({
      totalTopics: topics.length,
      masteredTopics: masteredCount,
      inProgressTopics: inProgressCount,
      notStartedTopics: notStartedCount,
      averageAccuracy: avgAccuracy,
      strongestSubject,
      weakestSubject
    });
  };
  
  // Get filtered and sorted topics
  const getFilteredTopics = (): TopicMastery[] => {
    return topicMastery
      .filter(topic => {
        // Apply subject filter
        if (selectedSubject !== null && topic.subject_id !== selectedSubject) {
          return false;
        }
        
        // Apply mastery level filter
        if (filterMastery !== null && topic.mastery_level !== filterMastery) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortBy === 'mastery') {
          const masteryOrder = {
            'mastered': 0,
            'advanced': 1,
            'intermediate': 2,
            'beginner': 3,
            'notStarted': 4
          };
          return (masteryOrder[a.mastery_level as keyof typeof masteryOrder] || 5) - 
                 (masteryOrder[b.mastery_level as keyof typeof masteryOrder] || 5);
        } else if (sortBy === 'accuracy') {
          return (b.accuracy_percentage || 0) - (a.accuracy_percentage || 0);
        } else if (sortBy === 'name') {
          return (a.topic_name || '').localeCompare(b.topic_name || '');
        }
        return 0;
      });
  };
  
  // Get data for subject performance chart
  const getSubjectPerformanceData = (): PerformanceData[] => {
    const subjectPerformance = new Map<string, { total: number, count: number }>();
    
    topicMastery.forEach(topic => {
      const subjectName = topic.subject_name;
      if (!subjectName) return;
      
      const current = subjectPerformance.get(subjectName) || { total: 0, count: 0 };
      if (topic.accuracy_percentage) {
        subjectPerformance.set(subjectName, {
          total: current.total + topic.accuracy_percentage,
          count: current.count + 1
        });
      }
    });
    
    return Array.from(subjectPerformance.entries())
      .map(([name, data]) => ({
        name,
        accuracy: data.count ? Math.round(data.total / data.count) : 0
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
  };
  
  // Helper functions for UI formatting
  const getMasteryColor = (level: string) => {
    switch(level) {
      case 'beginner': return '#fee2e2'; // red-100
      case 'intermediate': return '#fef3c7'; // yellow-100
      case 'advanced': return '#dbeafe'; // blue-100
      case 'mastered': return '#d1fae5'; // green-100
      case 'notStarted':
      default: return '#f3f4f6'; // gray-100
    }
  };
  
  const getMasteryTextColor = (level: string) => {
    switch(level) {
      case 'beginner': return '#b91c1c'; // red-700
      case 'intermediate': return '#b45309'; // yellow-700
      case 'advanced': return '#1e40af'; // blue-800
      case 'mastered': return '#047857'; // green-700
      case 'notStarted':
      default: return '#6b7280'; // gray-500
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatAccuracy = (accuracy: number | undefined) => {
    if (accuracy === undefined || accuracy === null) return 'N/A';
    return `${Math.round(accuracy)}%`;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading topics...</p>
        </div>
      </div>
    );
  }
  
  const filteredTopics = getFilteredTopics();
  const subjectPerformance = getSubjectPerformanceData();
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-800 mr-4 flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Topics & Mastery</h1>
        </div>
        <p className="text-gray-600">
          Track your mastery level across all topics
        </p>
      </header>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
              <Book size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Topics</p>
              <p className="text-2xl font-bold">{stats.totalTopics}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mastered</p>
              <p className="text-2xl font-bold">{stats.masteredTopics}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold">{stats.inProgressTopics}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <Star size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Accuracy</p>
              <p className="text-2xl font-bold">{formatAccuracy(stats.averageAccuracy)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subject Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Subject Performance</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={subjectPerformance}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
              <Bar dataKey="accuracy" name="Accuracy %" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Topic Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Topic Mastery</h2>
          <div className="text-sm text-gray-500">
            Showing {filteredTopics.length} of {topicMastery.length} topics
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm p-2"
              value={selectedSubject || ''}
              onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name} ({subject.topic_count} topics)
                </option>
              ))}
            </select>
          </div>
          
          {/* Mastery Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mastery Level</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm p-2"
              value={filterMastery || ''}
              onChange={(e) => setFilterMastery(e.target.value || null)}
            >
              <option value="">All Levels</option>
              <option value="mastered">Mastered</option>
              <option value="advanced">Advanced</option>
              <option value="intermediate">Intermediate</option>
              <option value="beginner">Beginner</option>
              <option value="notStarted">Not Started</option>
            </select>
          </div>
          
          {/* Sorting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm p-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="mastery">Mastery Level</option>
              <option value="accuracy">Accuracy</option>
              <option value="name">Topic Name</option>
            </select>
          </div>
        </div>
        
        {/* Topics List */}
        <div className="space-y-4">
          {filteredTopics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No topics match your filters. Try adjusting your selection.
            </div>
          ) : (
            filteredTopics.map(topic => (
              <div key={topic.topic_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg text-gray-900">{topic.topic_name}</h3>
                    <p className="text-sm text-gray-500">{topic.subject_name}</p>
                  </div>
                  <span 
                    className="text-xs px-3 py-1 rounded-full" 
                    style={{ 
                      backgroundColor: getMasteryColor(topic.mastery_level),
                      color: getMasteryTextColor(topic.mastery_level)
                    }}
                  >
                    {topic.mastery_level.charAt(0).toUpperCase() + topic.mastery_level.slice(1)}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="font-medium">{formatAccuracy(topic.accuracy_percentage)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Questions</p>
                    <p className="font-medium">{topic.questions_attempted || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Correct</p>
                    <p className="font-medium">{topic.questions_correct || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Practiced</p>
                    <p className="font-medium">{formatDate(topic.last_practiced)}</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full" 
                    style={{ width: `${topic.accuracy_percentage || 0}%` }}
                  ></div>
                </div>
                
                <div className="mt-4 flex justify-between">
                  <Link 
                    href={`/topics/${topic.topic_id}`} 
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    View Details
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                  
                  <Link 
                    href={`/practice?topic=${topic.topic_id}`}
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium px-4 py-2 rounded-md flex items-center"
                  >
                    Practice Topic
                    <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
