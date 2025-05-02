// src/app/admin/questions/components/ViewQuestionModal.tsx
import React from 'react';
import Image from 'next/image';
import { Question,Subject, Topic, Subtopic } from './types';

type ViewQuestionModalProps = {
  viewQuestion: Question;
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
  getTopicName: (topicId: number | null) => string;
  getSubtopicName: (subtopicId: number | null) => string;
  onClose: () => void;
};

export const ViewQuestionModal: React.FC<ViewQuestionModalProps> = ({
    viewQuestion,
    subjects,
    topics,
    getTopicName,
    getSubtopicName,
    onClose
  }) => {
    // Find subject for the topic
    const subject = subjects.find(s => 
      s.subject_id === Number(topics.find(t => t.topic_id === viewQuestion.topic_id)?.subject_id)
    );
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">View Question Details (ID: {viewQuestion.question_id})</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <p><strong>Subject:</strong> {subject?.subject_name || 'N/A'}</p>
            <p><strong>Topic:</strong> {getTopicName(viewQuestion.topic_id)}</p>
            <p><strong>Subtopic:</strong> {getSubtopicName(viewQuestion.subtopic_id)}</p>
            <p><strong>Question Number:</strong> {viewQuestion.question_number}</p>
            <p><strong>Type:</strong> {viewQuestion.question_type}</p>
            <p><strong>Difficulty:</strong> {viewQuestion.difficulty_level}</p>
            <p><strong>Marks:</strong> {viewQuestion.marks}</p>
            <p><strong>Active:</strong> {viewQuestion.is_active ? 'Yes' : 'No'}</p>
            <p><strong>Image Based:</strong> {viewQuestion.is_image_based ? 'Yes' : 'No'}</p>
            
            {viewQuestion.is_image_based && viewQuestion.image_url && (
              <div>
                <strong>Image:</strong> <br />
                <Image 
                  src={viewQuestion.image_url} 
                  alt="Question Image" 
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: 'auto' }}
                  className="mt-1 border rounded" 
                />
              </div>
            )}
            
            <div className="mt-2">
              <strong className="block mb-1">Question Text:</strong>
              <div 
                className="prose prose-sm max-w-none p-2 border rounded bg-gray-50" 
                dangerouslySetInnerHTML={{ __html: viewQuestion.question_text }}
              ></div>
            </div>
            
            {viewQuestion.explanation && (
              <div className="mt-2">
                <strong className="block mb-1">Explanation:</strong>
                <div 
                  className="prose prose-sm max-w-none p-2 border rounded bg-gray-50" 
                  dangerouslySetInnerHTML={{ __html: viewQuestion.explanation }}
                ></div>
              </div>
            )}
            
            <p><strong>Created At:</strong> {new Date(viewQuestion.created_at).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(viewQuestion.updated_at).toLocaleString()}</p>
          </div>
  
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };