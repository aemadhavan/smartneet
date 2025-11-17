'use client';

import Link from 'next/link';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { memo, useMemo, useEffect, useState } from 'react';

interface TopicsWithSubtopicCount {
  topic_id: number;
  subject_id: number;
  topic_name: string;
  parent_topic_id: number | null;
  description: string | null;
  is_active: boolean | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  subtopicsCount: number;
}

interface PhysicsContentProps {
  initialTopics: TopicsWithSubtopicCount[];
}

// Memoized topic card component for better performance
const TopicCard = memo(({
  topic,
  isAccessible
}: {
  topic: TopicsWithSubtopicCount;
  isAccessible: boolean
}) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 relative">
    <div className={`p-6 ${!isAccessible && 'relative'}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{topic.topic_name}</h3>
      <p className="text-gray-600 mb-4">{topic.description || 'No description available'}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{topic.subtopicsCount} subtopics</span>
        {isAccessible ? (
          <Link
            href={`/physics/topics/${topic.topic_id}`}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
            prefetch={true}
          >
            Explore Topic →
          </Link>
        ) : (
          <Link
            href={`/pricing?from=physics-topic-${topic.topic_id}`}
            className="text-amber-600 hover:text-amber-800 font-medium text-sm flex items-center"
            prefetch={false}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Unlock Premium Practice
          </Link>
        )}
      </div>
    </div>

    {!isAccessible && (
      <>
        <div className="absolute top-2 right-2 z-10 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
          Premium Practice
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-50 opacity-25 pointer-events-none"></div>
      </>
    )}
  </div>
));

TopicCard.displayName = 'TopicCard';

export default function PhysicsContent({ initialTopics }: PhysicsContentProps) {
  // Start with free tier assumption for instant render
  const [clientIsPremium, setClientIsPremium] = useState(false);
  const { isPremium, loading: subscriptionLoading } = useSubscriptionLimits();

  // Update premium status when available, without blocking initial render
  useEffect(() => {
    if (!subscriptionLoading) {
      setClientIsPremium(isPremium);
    }
  }, [isPremium, subscriptionLoading]);

  // Memoize the practice link to avoid re-renders
  const practiceLink = useMemo(() => {
    return clientIsPremium ? "/practice?subject=physics" : "/practice?subject=physics&limit=free";
  }, [clientIsPremium]);

  // Memoize topics with access info - show content immediately, update access later
  const topicsWithAccess = useMemo(() => {
    return initialTopics.map((topic, index) => ({
      ...topic,
      isAccessible: clientIsPremium || index < 2
    }));
  }, [initialTopics, clientIsPremium]);

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ contentVisibility: 'auto' }}>
          Physics
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Physics is the natural science that studies matter, energy, motion, and force. Master the fundamental concepts of mechanics, thermodynamics, electromagnetism, and modern physics for NEET.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href={practiceLink}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 text-lg font-medium shadow-sm transition-colors"
            prefetch={true}
          >
            Practice Physics Questions
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">NEET Physics Overview</h2>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-blue-600 text-2xl font-bold mb-1">45</p>
            <p className="text-gray-600">Questions</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-blue-600 text-2xl font-bold mb-1">180</p>
            <p className="text-gray-600">Marks</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-blue-600 text-2xl font-bold mb-1">{initialTopics.length}</p>
            <p className="text-gray-600">Major Topics</p>
          </div>
        </div>
      </div>

      {!clientIsPremium && !subscriptionLoading && (
        <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-blue-700">
            <span className="font-semibold">Free plan:</span> You have access to the first two topics.
            <Link href="/pricing" className="ml-2 text-blue-600 underline" prefetch={false}>
              Upgrade to premium
            </Link> for full access to all topics.
          </p>
        </div>
      )}

      {initialTopics.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">No topics available. Please check back later.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6" style={{ contentVisibility: 'auto' }}>
          {topicsWithAccess.map((topic) => (
            <TopicCard
              key={topic.topic_id}
              topic={topic}
              isAccessible={topic.isAccessible}
            />
          ))}
        </div>
      )}
    </div>
  );
}
