// src/app/admin/questions/components/QuestionsFilters.tsx

import React from 'react';
import { QuestionsFiltersProps } from './types';


  


export const QuestionsFilters: React.FC<QuestionsFiltersProps> = ({
  subjects,
  topics,
  subtopics,
  papers,
  questionTypes,
  selectedSubject,
  selectedTopic,
  selectedSubtopic,
  selectedPaperId,
  selectedType,
  currentPaper,
  onSubjectChange,
  onTopicChange,
  onSubtopicChange,
  onPaperChange,
  onTypeChange
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subject Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject:
          </label>
          <select
            value={selectedSubject || ''}
            onChange={onSubjectChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {subjects.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.subject_name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Topic Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic:
          </label>
          <select
            value={selectedTopic?.toString() || ''}
            onChange={onTopicChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic.topic_id} value={topic.topic_id}>
                {topic.topic_name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Subtopic Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtopic:
          </label>
          <select
            value={selectedSubtopic?.toString() || ''}
            onChange={onSubtopicChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={!selectedTopic || subtopics.length === 0}
          >
            <option value="">All Subtopics</option>
            {subtopics.map((subtopic) => (
              <option key={subtopic.subtopic_id} value={subtopic.subtopic_id}>
                {subtopic.subtopic_name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Question Type Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Type:
          </label>
          <select
            value={selectedType}
            onChange={onTypeChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Types</option>
            {questionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Current Paper Info */}
        {currentPaper && (
          <div className="col-span-full bg-indigo-50 p-3 rounded-md mb-2">
            <h3 className="font-medium text-indigo-800">
              Viewing questions for: {currentPaper.subject} ({currentPaper.paper_year})
              {currentPaper.paper_code && ` - ${currentPaper.paper_code}`}
              {currentPaper.section && ` Section ${currentPaper.section}`}
            </h3>
          </div>
        )}
        
        {/* Question Paper Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Paper:
          </label>
          <select
            value={selectedPaperId?.toString() || ''}
            onChange={onPaperChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Papers</option>
            {papers.map((paper) => (
              <option key={paper.paper_id} value={paper.paper_id}>
                {paper.subject} ({paper.paper_year})
                {paper.paper_code && ` - ${paper.paper_code}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
export default QuestionsFilters;