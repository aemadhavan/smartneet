//File: src/app/biology/zoo/topics/[id]/page.tsx

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';

interface Topic {
  topic_id: number;
  subject_id: number;
  topic_name: string;
  parent_topic_id: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Subtopic {
  subtopic_id: number;
  topic_id: number;
  subtopic_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function TopicDetailPage() {
  const params = useParams();
  const topicId = params.id as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubtopicId, setActiveSubtopicId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTopicDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch topic details using the API
        const response = await fetch(`/api/topics/${topicId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch topic details');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch topic details');
        }
        
        setTopic(data.topic);
        setSubtopics(data.subtopics);
        
        // Set first subtopic as active if any exist
        if (data.subtopics && data.subtopics.length > 0) {
          setActiveSubtopicId(data.subtopics[0].subtopic_id);
        }
      } catch (err) {
        console.error('Error fetching topic details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopicDetails();
  }, [topicId]);

  // Find the active subtopic
  const activeSubtopic = subtopics.find(s => s.subtopic_id === activeSubtopicId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading topic details...</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-center">
          <h2 className="text-lg font-semibold mb-2">Error Loading Topic</h2>
          <p>{error || 'Topic not found'}</p>
          <Link href="/biology/zoo" className="mt-4 inline-block bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200">
            Return to Zoology
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Navigation */}
      <div className="mb-8">
        <Link href="/biology/zoo" className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm">
          <ArrowLeft size={16} className="mr-1" />
          Back to Zoology Topics
        </Link>
      </div>
      
      {/* Topic Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{topic.topic_name}</h1>
        <p className="text-gray-600 max-w-3xl">
          {topic.description || 'No description available for this topic.'}
        </p>
      </header>
      
      {/* Main Content Area */}
      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Subtopics</h2>
            
            {subtopics.length === 0 ? (
              <p className="text-gray-500 text-sm">No subtopics available</p>
            ) : (
              <ul className="space-y-2">
                {subtopics.map((subtopic) => (
                  <li key={subtopic.subtopic_id}>
                    <button
                      onClick={() => setActiveSubtopicId(subtopic.subtopic_id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        activeSubtopicId === subtopic.subtopic_id
                          ? 'bg-amber-50 text-amber-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {subtopic.subtopic_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="mt-6 pt-4 border-t">
              <Link 
                href={`/practice?subject=zoology&topicId=${topic.topic_id}`}
                className="bg-amber-600 text-white w-full py-2 px-4 rounded-md hover:bg-amber-700 flex items-center justify-center"
              >
                <BookOpen size={18} className="mr-2" />
                Practice {topic.topic_name}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          {/* Selected Subtopic Content */}
          {activeSubtopic ? (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{activeSubtopic.subtopic_name}</h2>
              <p className="text-gray-600 mb-6">
                {activeSubtopic.description || 'No detailed description available for this subtopic.'}
              </p>
              
              {/* Key Points - Placeholder content */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Key Points</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle size={20} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>This is a key point about {activeSubtopic.subtopic_name} that students should understand.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={20} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Another important concept or principle related to this subtopic.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={20} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>A third key point that is commonly tested in examinations.</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-8 flex justify-between">
                <Link 
                  href={`/notes/biology/${topic.topic_id}/${activeSubtopic.subtopic_id}`} 
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  View Study Notes
                </Link>
                <Link
                  href={`/practice?subject=zoology&topicId=${topic.topic_id}&subtopicId=${activeSubtopic.subtopic_id}`}
                  className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-4 py-2 rounded-md"
                >
                  Practice Questions
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
              <p className="text-gray-500">
                {subtopics.length > 0 
                  ? 'Select a subtopic to view its content' 
                  : 'No subtopics available for this topic'}
              </p>
            </div>
          )}
          
          {/* Related Topics */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Related NEET Topics</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                href="/biology/zoo/topics/10" 
                className="bg-white p-4 rounded border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-gray-800">Structural Organization in Animals</h4>
                <p className="text-sm text-gray-500 mt-1">Study of morphology and anatomy of animals</p>
              </Link>
              <Link 
                href="/biology/zoo/topics/11" 
                className="bg-white p-4 rounded border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-gray-800">Cell Structure and Function</h4>
                <p className="text-sm text-gray-500 mt-1">Study of cell organelles and cellular processes in animal cells</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}