// src/app/admin/questions/components/QuestionsTable.tsx
import React from 'react';
import Image from 'next/image';

type Question = {
    question_id: number;
    paper_id: number | null;
    question_number: number;
    topic_id: number | null;
    subtopic_id: number | null;
    question_type: string;
    question_text: string;
    explanation: string | null;
    difficulty_level: string;
    marks: number;
    is_image_based: boolean;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  
type QuestionsTableProps = {
  questions: Question[];
  getTopicName: (topicId: number | null) => string;
  onViewClick: (id: number) => void;
  onEditClick: (id: number) => void;
  onDeleteClick: (id: number) => void;
};

export const QuestionsTable: React.FC<QuestionsTableProps> = ({
  questions,
  getTopicName,
  onViewClick,
  onEditClick,
  onDeleteClick
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {questions.map((question) => (
            <tr key={question.question_id}>
              <td className="px-6 py-4 whitespace-nowrap">{question.question_id}</td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 line-clamp-2">
                  {question.question_text.substring(0, 100)}
                  {question.question_text.length > 100 ? '...' : ''}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.question_type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTopicName(question.topic_id)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${question.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' : 
                    question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                    question.difficulty_level === 'hard' ? 'bg-orange-100 text-orange-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {question.difficulty_level}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.marks}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  onClick={() => onViewClick(question.question_id)} 
                  className="text-blue-600 hover:text-blue-900 mr-2"
                >
                  View
                </button>
                <button 
                  onClick={() => onEditClick(question.question_id)} 
                  className="text-indigo-600 hover:text-indigo-900 mr-2"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDeleteClick(question.question_id)} 
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};