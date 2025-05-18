//File: src/components/topics/TopicCard.tsx
import React from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';

interface TopicCardProps {
  topicId: number;
  topicName: string;
  description: string;
  subtopicsCount: number;
  index: number;
  isPremium: boolean;
  maxTopicsPerSubject: number;
  onPremiumClick: () => void;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topicId,
  topicName,
  description,
  subtopicsCount,
  index,
  isPremium,
  maxTopicsPerSubject,
  onPremiumClick
}) => {
  const isAccessible = isPremium || index < maxTopicsPerSubject;
  const isPremiumLocked = !isAccessible;

  // Premium locked topic with indigo/blue design instead of black
  if (isPremiumLocked) {
    return (
      <div className="relative bg-indigo-600 rounded-lg overflow-hidden h-[150px] flex flex-col items-center justify-center">
        <div className="absolute top-4 right-4 bg-yellow-500 rounded-full p-2 w-8 h-8 flex items-center justify-center z-10">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        <h3 className="text-white font-semibold text-xl mb-2">Premium Feature</h3>
        <p className="text-white text-base mb-5">Unlock this topic and 5 more with Premium!</p>
        <button 
          onClick={onPremiumClick}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 text-sm font-medium"
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  // Regular card for accessible topics
  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{topicName}</h3>
          
          {/* Topic badge - Shows "Free" or "Premium" based on access */}
          {!isPremium && isAccessible && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Free</span>
          )}
          {isPremium && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Premium</span>
          )}
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{description || 'Main topic covering important concepts and principles.'}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <BookOpen className="h-4 w-4 mr-1" />
            <span>{subtopicsCount} subtopics</span>
          </div>
          
          {/* Explore Topic Link/Button */}
          <Link 
            href={`/biology/bot/topics/${topicId}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            Explore Topic
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;