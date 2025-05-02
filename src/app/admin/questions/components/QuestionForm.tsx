// src/app/admin/questions/components/QuestionForm.tsx
import React from 'react';
import { Question, QuestionPaper, Subtopic, Topic } from './types';

type QuestionFormProps = {
    currentQuestion: Partial<Question>;
    topics: Topic[];
    subtopics: Subtopic[];
    papers: QuestionPaper[];
    questionTypes: string[];
    difficultyLevels: string[];
    formMode: 'create' | 'edit';
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
  };

export const QuestionForm: React.FC<QuestionFormProps> = ({
  currentQuestion,
  topics,
  formMode,
  onInputChange,
  onSubmit,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {formMode === 'create' ? 'Add New Question' : 'Edit Question'}
        </h2>
        
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Form fields similar to the original implementation */}
          {/* You'd transfer the existing form fields here */}
          {/* Example structure shown, full implementation would match the original form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="topic_id">
                Topic
              </label>
              <select
                id="topic_id"
                name="topic_id"
                value={currentQuestion.topic_id?.toString() || ''}
                onChange={onInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select a Topic</option>
                {topics.map((topic) => (
                  <option key={topic.topic_id} value={topic.topic_id}>
                    {topic.topic_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Rest of the form fields would follow the same pattern */}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {formMode === 'create' ? 'Create Question' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};