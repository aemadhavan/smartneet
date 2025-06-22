//File: src/app/biology/zoo/page.tsx

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

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

interface TopicsWithSubtopicCount extends Topic {
  subtopicsCount: number;
}

export default function ZoologyPage() {
  const [topics, setTopics] = useState<TopicsWithSubtopicCount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isPremium, loading: subscriptionLoading } = useSubscriptionLimits();

  useEffect(() => {
    const fetchTopicsAndSubtopics = async () => {
      if (subscriptionLoading) {
        return;
      }
      try {
        setIsLoading(true);
        
        // Find zoology subject ID (should be 4 based on your schema)
        const zoologySubjectId = 4; // Zoology subject ID
        
        // Fetch root-level topics for Zoology
        const topicsResponse = await fetch(`/api/topics?subjectId=${zoologySubjectId}&isRootLevel=true&isActive=true`);
        
        if (!topicsResponse.ok) {
          throw new Error('Failed to fetch topics');
        }
        
        const topicsData = await topicsResponse.json();
        
        if (!topicsData.success) {
          throw new Error(topicsData.error || 'Failed to fetch topics');
        }
        
        // For each topic, fetch the count of subtopics
        const topicsWithSubtopicCounts = await Promise.all(
          topicsData.data.map(async (topic: Topic) => {
            const subtopicsResponse = await fetch(`/api/subtopics?topicId=${topic.topic_id}&isActive=true`);
            
            if (!subtopicsResponse.ok) {
              return { ...topic, subtopicsCount: 0 };
            }
            
            const subtopicsData = await subtopicsResponse.json();
            const subtopicsCount = subtopicsData.success ? subtopicsData.data.length : 0;
            
            return { ...topic, subtopicsCount };
          })
        );
        
        setTopics(topicsWithSubtopicCounts);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopicsAndSubtopics();
  }, [subscriptionLoading]);

  // Function to determine if user can access the topic
  const canAccessTopic = (index: number) => {
    return isPremium || index < 2; // First two topics accessible for free users
  };

  if (isLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">
          {subscriptionLoading ? "Loading subscription status..." : "Loading zoology topics..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-center">
          <h2 className="text-lg font-semibold mb-2">Error Loading Data</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Debug information - you can remove this in production */}
      {/*<div className="mb-4 p-2 bg-gray-100 text-xs">
        <p>Debug: isPremium={String(isPremium)}, isSignedIn={String(isSignedIn)}, subscriptionLoaded={String(subscriptionLoaded)}</p>
        <p>Subscription plan: {subscription?.planCode || 'Not loaded'}</p>
      </div>*/}
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Zoology</h1>
        <p className="text-gray-600 max-w-3xl">
          Zoology is the branch of biology that studies the animal kingdom, including the structure, embryology, evolution, classification, habits, and distribution of all animals.
        </p>
        <div className="mt-10 flex justify-center">
          <Link 
            href={isPremium ? "/practice?subject=zoology" : "/practice?subject=zoology&limit=free"}
            className="bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700 text-lg font-medium shadow-sm"
          >
            Practice Zoology Questions
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">NEET Zoology Overview</h2>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-amber-50 p-4 rounded-md">
            <p className="text-amber-600 text-2xl font-bold mb-1">45</p>
            <p className="text-gray-600">Questions</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-md">
            <p className="text-amber-600 text-2xl font-bold mb-1">180</p>
            <p className="text-gray-600">Marks</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-md">
            <p className="text-amber-600 text-2xl font-bold mb-1">{topics.length}</p>
            <p className="text-gray-600">Major Topics</p>
          </div>
        </div>
      </div>

      {/* Free access notice - only show for non-premium users */}
      {!isPremium && (
        <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-blue-700">
            <span className="font-semibold">Free plan:</span> You have access to the first two topics. 
            <Link href="/pricing" className="ml-2 text-blue-600 underline">Upgrade to premium</Link> for full access to all topics.
          </p>
        </div>
      )}

      {topics.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">No topics available. Please check back later.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {topics.map((topic, index) => {
            // Use the canAccessTopic function to determine accessibility
            const isTopicAccessible = canAccessTopic(index);
            
            return (
              <div key={topic.topic_id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 relative">
                <div className={`p-6 ${!isTopicAccessible && 'relative'}`}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{topic.topic_name}</h3>
                  <p className="text-gray-600 mb-4">{topic.description || 'No description available'}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{topic.subtopicsCount} subtopics</span>
                    {isTopicAccessible ? (
                      <Link 
                        href={`/biology/zoo/topics/${topic.topic_id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
                      >
                        Explore Topic →
                      </Link>
                    ) : (
                      <Link 
                        href={`/pricing?from=zoology-topic-${topic.topic_id}`}
                        className="text-amber-600 hover:text-amber-800 font-medium text-sm flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Unlock Premium Practice
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* Premium indicators for premium topics */}
                {!isTopicAccessible && (
                  <>
                    <div className="absolute top-2 right-2 z-10 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                      Premium Practice
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-50 opacity-25 pointer-events-none"></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}