// src/app/dashboard/topics/page.tsx
"use client";

import { useState, useEffect } from 'react';
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
  Cell
} from 'recharts';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ChevronDown,
  BookOpen
} from 'lucide-react';

// Types
interface TopicMastery {
  topic_id: number;
  topic_name: string;
  subject_id: number; // Added missing property
  subject_name: string;
  mastery_level: string;
  accuracy_percentage: number;
  questions_attempted: number;
  last_practiced: string | null; // Updated to allow null values
}

interface Subject {
  subject_id: number;
  subject_name: string;
}

export default function TopicsDashboardPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicMastery[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedMasteryLevel, setSelectedMasteryLevel] = useState<string | null>(null);
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=dashboard/topics');
      return;
    }
    
    if (isSignedIn) {
      fetchData();
    }
  }, [isSignedIn, isLoaded, router]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // In a real implementation, fetch from API
      const subjectsData = await fetchSubjects();
      const topicsData = await fetchTopicMastery();
      
      setSubjects(subjectsData);
      setTopics(topicsData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Use mock data even in case of error
      setSubjects(mockFetchSubjects());
      setTopics(mockFetchAllTopicsMastery());
      setLoading(false);
    }
  };
  
  // Fetch all subject data
  const fetchSubjects = async (): Promise<Subject[]> => {
    try {
      const response = await fetch('/api/subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return mockFetchSubjects();
    }
  };
  
  // Fetch all topic mastery data
  const fetchTopicMastery = async (): Promise<TopicMastery[]> => {
    try {
      const response = await fetch('/api/topic-mastery/all');
      if (!response.ok) {
        throw new Error('Failed to fetch topic mastery');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching topic mastery:', error);
      return mockFetchAllTopicsMastery();
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
  
  // Get mastery level label color
  const getMasteryTextColor = (level: string) => {
    if (level === 'notStarted') return '#6b7280'; // gray-500
    return '#1f2937'; // gray-800
  };
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Filter topics based on search and filters
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = searchQuery === '' || 
      topic.topic_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = selectedSubject === null || 
      selectedSubject === 0 || // All subjects option
      topic.subject_id === selectedSubject;
    
    const matchesMastery = selectedMasteryLevel === null || 
      topic.mastery_level === selectedMasteryLevel;
    
    return matchesSearch && matchesSubject && matchesMastery;
  });
  
  // Group by mastery level for chart
  const masteryData = [
    { name: 'Not Started', value: topics.filter(t => t.mastery_level === 'notStarted').length },
    { name: 'Beginner', value: topics.filter(t => t.mastery_level === 'beginner').length },
    { name: 'Intermediate', value: topics.filter(t => t.mastery_level === 'intermediate').length },
    { name: 'Advanced', value: topics.filter(t => t.mastery_level === 'advanced').length },
    { name: 'Mastered', value: topics.filter(t => t.mastery_level === 'mastered').length }
  ];
  
  // Generate colors for chart
  const masteryChartColors = [
    '#f3f4f6', // Not Started - gray-100
    '#fee2e2', // Beginner - red-100
    '#fef3c7', // Intermediate - yellow-100
    '#dbeafe', // Advanced - blue-100
    '#d1fae5'  // Mastered - green-100
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading topic data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <Link href="/dashboard" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Topic Mastery</h1>
          <p className="text-gray-600">Track your progress across all topics</p>
        </div>
      </div>
      
      {/* Summary and Charts Row */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Mastery Overview</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={masteryData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" name="Topics" radius={[0, 4, 4, 0]}>
                  {masteryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={masteryChartColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Progress Summary</h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">Total Topics</h3>
                <span className="font-bold text-2xl text-gray-800">{topics.length}</span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full w-full">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">Mastered</h3>
                <span className="font-bold text-2xl text-emerald-600">
                  {topics.filter(t => t.mastery_level === 'mastered').length}
                </span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full w-full">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ 
                    width: `${(topics.filter(t => t.mastery_level === 'mastered').length / topics.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">In Progress</h3>
                <span className="font-bold text-2xl text-blue-600">
                  {topics.filter(t => ['beginner', 'intermediate', 'advanced'].includes(t.mastery_level)).length}
                </span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full w-full">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ 
                    width: `${(topics.filter(t => ['beginner', 'intermediate', 'advanced'].includes(t.mastery_level)).length / topics.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">Not Started</h3>
                <span className="font-bold text-2xl text-gray-500">
                  {topics.filter(t => t.mastery_level === 'notStarted').length}
                </span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full w-full">
                <div 
                  className="bg-gray-400 h-2 rounded-full" 
                  style={{ 
                    width: `${(topics.filter(t => t.mastery_level === 'notStarted').length / topics.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search topics..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-4">
            <div className="relative">
              <select
                className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                value={selectedSubject || ''}
                onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={16} />
              </div>
            </div>
            
            <div className="relative">
              <select
                className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                value={selectedMasteryLevel || ''}
                onChange={(e) => setSelectedMasteryLevel(e.target.value || null)}
              >
                <option value="">All Mastery Levels</option>
                <option value="notStarted">Not Started</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="mastered">Mastered</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={16} />
              </div>
            </div>
            
            <button 
              className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject(null);
                setSelectedMasteryLevel(null);
              }}
            >
              <Filter size={16} className="mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Topics List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4">Topic</div>
              <div className="col-span-2">Subject</div>
              <div className="col-span-2">Mastery Level</div>
              <div className="col-span-1 text-center">Accuracy</div>
              <div className="col-span-1 text-center">Questions</div>
              <div className="col-span-2">Last Practiced</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredTopics.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500">
                No topics match your search criteria. Try adjusting your filters.
              </div>
            ) : (
              filteredTopics.map((topic) => (
                <div key={topic.topic_id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Link 
                        href={`/practice?topic=${topic.topic_id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center"
                      >
                        <BookOpen size={16} className="mr-2" />
                        {topic.topic_name}
                      </Link>
                    </div>
                    <div className="col-span-2 text-sm text-gray-700">
                      {topic.subject_name}
                    </div>
                    <div className="col-span-2">
                      <span
                        className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                        style={{ 
                          backgroundColor: getMasteryColor(topic.mastery_level),
                          color: getMasteryTextColor(topic.mastery_level)
                        }}
                      >
                        {topic.mastery_level.charAt(0).toUpperCase() + topic.mastery_level.slice(1)}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span 
                        className={`text-sm font-medium ${
                          topic.accuracy_percentage >= 80 ? 'text-emerald-600' : 
                          topic.accuracy_percentage >= 60 ? 'text-amber-600' : 
                          'text-red-600'
                        }`}
                      >
                        {topic.accuracy_percentage}%
                      </span>
                    </div>
                    <div className="col-span-1 text-center text-sm text-gray-700">
                      {topic.questions_attempted}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">
                      {formatDate(topic.last_practiced)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data functions (for development and testing)
function mockFetchSubjects(): Subject[] {
  return [
    { subject_id: 1, subject_name: 'Biology' },
    { subject_id: 2, subject_name: 'Physics' },
    { subject_id: 3, subject_name: 'Chemistry' },
    { subject_id: 4, subject_name: 'Mathematics' }
  ];
}

function mockFetchAllTopicsMastery(): TopicMastery[] {
  return [
    {
      topic_id: 1,
      topic_name: 'Diversity in Living World',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'mastered',
      accuracy_percentage: 92,
      questions_attempted: 35,
      last_practiced: '2025-04-11T10:20:00Z'
    },
    {
      topic_id: 2,
      topic_name: 'Structural Organization in Plants & Animals',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'advanced',
      accuracy_percentage: 81,
      questions_attempted: 28,
      last_practiced: '2025-04-09T14:30:00Z'
    },
    {
      topic_id: 3,
      topic_name: 'Cell Structure and Function',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'beginner',
      accuracy_percentage: 42,
      questions_attempted: 25,
      last_practiced: '2025-04-12T09:30:00Z'
    },
    {
      topic_id: 4,
      topic_name: 'Plant Physiology',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'intermediate',
      accuracy_percentage: 68,
      questions_attempted: 30,
      last_practiced: '2025-04-10T14:15:00Z'
    },
    {
      topic_id: 5,
      topic_name: 'Human Physiology',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'notStarted',
      accuracy_percentage: 0,
      questions_attempted: 0,
      last_practiced: null
    },
    {
      topic_id: 6,
      topic_name: 'Reproduction',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'intermediate',
      accuracy_percentage: 72,
      questions_attempted: 18,
      last_practiced: '2025-04-07T16:20:00Z'
    },
    {
      topic_id: 7,
      topic_name: 'Genetics and Evolution',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'beginner',
      accuracy_percentage: 54,
      questions_attempted: 22,
      last_practiced: '2025-04-08T11:45:00Z'
    },
    {
      topic_id: 8,
      topic_name: 'Biology and Human Welfare',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'notStarted',
      accuracy_percentage: 0,
      questions_attempted: 0,
      last_practiced: null
    },
    {
      topic_id: 9,
      topic_name: 'Biotechnology and its Applications',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'notStarted',
      accuracy_percentage: 0,
      questions_attempted: 0,
      last_practiced: null
    },
    {
      topic_id: 10,
      topic_name: 'Ecology and Environment',
      subject_id: 1,
      subject_name: 'Biology',
      mastery_level: 'advanced',
      accuracy_percentage: 85,
      questions_attempted: 24,
      last_practiced: '2025-04-05T10:10:00Z'
    },
    {
      topic_id: 11,
      topic_name: 'Physical World and Measurement',
      subject_id: 2,
      subject_name: 'Physics',
      mastery_level: 'intermediate',
      accuracy_percentage: 65,
      questions_attempted: 20,
      last_practiced: '2025-04-02T13:40:00Z'
    },
    {
      topic_id: 12,
      topic_name: 'Kinematics',
      subject_id: 2,
      subject_name: 'Physics',
      mastery_level: 'beginner',
      accuracy_percentage: 48,
      questions_attempted: 15,
      last_practiced: '2025-04-03T09:20:00Z'
    },
    {
      topic_id: 13,
      topic_name: 'Laws of Motion',
      subject_id: 2,
      subject_name: 'Physics',
      mastery_level: 'notStarted',
      accuracy_percentage: 0,
      questions_attempted: 0,
      last_practiced: null
    },
    {
      topic_id: 14,
      topic_name: 'Work, Energy and Power',
      subject_id: 2,
      subject_name: 'Physics',
      mastery_level: 'notStarted',
      accuracy_percentage: 0,
      questions_attempted: 0,
      last_practiced: null
    },
    {
      topic_id: 15,
      topic_name: 'Atomic Structure',
      subject_id: 3,
      subject_name: 'Chemistry',
      mastery_level: 'intermediate',
      accuracy_percentage: 70,
      questions_attempted: 22,
      last_practiced: '2025-04-01T11:15:00Z'
    },
    {
      topic_id: 16,
      topic_name: 'Chemical Bonding',
      subject_id: 3,
      subject_name: 'Chemistry',
      mastery_level: 'beginner',
      accuracy_percentage: 52,
      questions_attempted: 18,
      last_practiced: '2025-03-30T14:20:00Z'
    },
    {
      topic_id: 17,
      topic_name: 'Organic Chemistry',
      subject_id: 3,
      subject_name: 'Chemistry',
      mastery_level: 'notStarted',
      accuracy_percentage: 0,
      questions_attempted: 0,
      last_practiced: null
    },
    {
      topic_id: 18,
      topic_name: 'Algebra',
      subject_id: 4,
      subject_name: 'Mathematics',
      mastery_level: 'mastered',
      accuracy_percentage: 94,
      questions_attempted: 30,
      last_practiced: '2025-03-28T10:30:00Z'
    },
    {
      topic_id: 19,
      topic_name: 'Calculus',
      subject_id: 4,
      subject_name: 'Mathematics',
      mastery_level: 'advanced',
      accuracy_percentage: 86,
      questions_attempted: 25,
      last_practiced: '2025-03-29T09:45:00Z'
    },
    {
      topic_id: 20,
      topic_name: 'Statistics',
      subject_id: 4,
      subject_name: 'Mathematics',
      mastery_level: 'intermediate',
      accuracy_percentage: 74,
      questions_attempted: 20,
      last_practiced: '2025-04-02T15:50:00Z'
    }
  ];
}