import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Filter, Search, Award } from 'lucide-react';
import TopicMasteryCard from './TopicMasteryCard'; // Assuming this is the correct import path

// Mastery level order for sorting
const MASTERY_LEVEL_ORDER = {
  'notStarted': 0,
  'beginner': 1,
  'intermediate': 2,
  'advanced': 3,
  'mastered': 4
};

const TopicMasteryPanel = ({ topicMastery, masteredTopics }) => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  // Filter topics based on mastery level and search query
  const filteredTopics = topicMastery.filter(topic => {
    const matchesFilter = filter === 'all' || topic.mastery_level === filter;
    const matchesSearch = topic.topic_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  
  // Sort topics based on selected sort method
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (sortBy === 'name') {
      return a.topic_name.localeCompare(b.topic_name);
    } else if (sortBy === 'mastery') {
      return MASTERY_LEVEL_ORDER[b.mastery_level] - MASTERY_LEVEL_ORDER[a.mastery_level];
    } else if (sortBy === 'accuracy') {
      return b.accuracy_percentage - a.accuracy_percentage;
    } else if (sortBy === 'questions') {
      return b.questions_attempted - a.questions_attempted;
    }
    return 0;
  });
  
  // Calculate statistics
  const topicStats = {
    total: topicMastery.length,
    mastered: topicMastery.filter(t => t.mastery_level === 'mastered').length,
    advanced: topicMastery.filter(t => t.mastery_level === 'advanced').length,
    intermediate: topicMastery.filter(t => t.mastery_level === 'intermediate').length,
    beginner: topicMastery.filter(t => t.mastery_level === 'beginner').length,
    notStarted: topicMastery.filter(t => t.mastery_level === 'notStarted').length,
  };
  
  const displayLimit = 5;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white text-gray-800">Topic Mastery</h2>
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full flex items-center">
            <Award size={14} className="mr-1" />
            {masteredTopics} mastered
          </div>
        </div>
      </div>
      
      {/* Statistics Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-700">
          Total: {topicStats.total}
        </div>
        <div className="text-xs px-2 py-1 bg-green-100 rounded-md text-green-800">
          Mastered: {topicStats.mastered}
        </div>
        <div className="text-xs px-2 py-1 bg-blue-100 rounded-md text-blue-800">
          Advanced: {topicStats.advanced}
        </div>
        <div className="text-xs px-2 py-1 bg-yellow-100 rounded-md text-yellow-800">
          Intermediate: {topicStats.intermediate}
        </div>
        <div className="text-xs px-2 py-1 bg-red-100 rounded-md text-red-800">
          Beginner: {topicStats.beginner}
        </div>
        <div className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-700">
          Not Started: {topicStats.notStarted}
        </div>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search topics..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex items-center">
            <Filter size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="mastered">Mastered</option>
              <option value="advanced">Advanced</option>
              <option value="intermediate">Intermediate</option>
              <option value="beginner">Beginner</option>
              <option value="notStarted">Not Started</option>
            </select>
          </div>
          
          <select
            className="py-1.5 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="mastery">Sort by Mastery</option>
            <option value="accuracy">Sort by Accuracy</option>
            <option value="questions">Sort by Questions</option>
          </select>
        </div>
      </div>
      
      {/* Topics List */}
      <div className="space-y-3">
        {sortedTopics.length === 0 ? (
          <p className="dark:text-white text-gray-500 text-center py-4">
            {topicMastery.length === 0 
              ? "No topic mastery data available yet." 
              : "No topics match your search criteria."}
          </p>
        ) : (
          sortedTopics.slice(0, displayLimit).map(topic => (
            <TopicMasteryCard key={topic.topic_id} topic={topic} />
          ))
        )}
        
        {sortedTopics.length > displayLimit && (
          <div className="text-center text-sm text-gray-500 mt-2">
            {sortedTopics.length - displayLimit} more topics not shown
          </div>
        )}
      </div>
      
      {/* Footer with Link */}
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
};

export default TopicMasteryPanel;