// File: src/components/dashboard/TopicMasteryPanel.jsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getMasteryColor } from '@/lib/dashboard/formatting';

export default function TopicMasteryPanel({ topicMastery, masteredTopics }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold dark:text-white text-gray-800">Topic Mastery</h2>
        <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
          {masteredTopics} mastered
        </div>
      </div>
      
      <div className="space-y-4">
        {topicMastery.length === 0 ? (
          <p className="dark:text-white text-gray-500 text-center py-4">No topic mastery data available yet.</p>
        ) : (
          topicMastery.slice(0, 5).map(topic => (
            <TopicMasteryCard key={topic.topic_id} topic={topic} />
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
  );
}