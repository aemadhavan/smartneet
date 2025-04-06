// src/app/admin/subtopics/page.tsx
'use client';

import { useState, useEffect } from 'react';

type Subject = {
  subject_id: number;
  subject_name: string;
  subject_code: string;
};

type Topic = {
  topic_id: number;
  subject_id: string;
  topic_name: string;
};

type Subtopic = {
  subtopic_id: number;
  topic_id: number;
  subtopic_name: string;
  description: string | null;
  is_active: boolean;
};

export default function SubtopicsPage() {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentSubtopic, setCurrentSubtopic] = useState<Partial<Subtopic>>({});

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/admin/subjects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }
        
        const data = await response.json();
        setSubjects(data);
        
        if (data.length > 0 && !selectedSubject) {
          setSelectedSubject(data[0].subject_id.toString());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };
    
    fetchSubjects();
  }, [selectedSubject]);

  // Fetch topics when subject changes
  useEffect(() => {
    const fetchTopicsBySubject = async () => {
      if (!selectedSubject) return;
      
      try {
        const response = await fetch(`/api/admin/topics?subjectId=${selectedSubject}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }
        
        const data = await response.json();
        setTopics(data);
        
        // Reset selected topic or set to first topic
        if (data.length > 0) {
          if (!selectedTopic || !data.some((t: Topic) => t.topic_id === selectedTopic)) {
            setSelectedTopic(data[0].topic_id);
          }
        } else {
          setSelectedTopic(null);
          setSubtopics([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };
    
    fetchTopicsBySubject();
  }, [selectedSubject, selectedTopic]);

  // Fetch subtopics when topic changes
  useEffect(() => {
    const fetchSubtopicsByTopic = async () => {
      if (!selectedTopic) {
        setSubtopics([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/subtopics?topicId=${selectedTopic}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch subtopics');
        }
        
        const data = await response.json();
        setSubtopics(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };
    
    fetchSubtopicsByTopic();
  }, [selectedTopic]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopic(Number(e.target.value));
  };

  const handleCreateClick = () => {
    setCurrentSubtopic({ topic_id: selectedTopic || 0 });
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEditClick = (subtopic: Subtopic) => {
    setCurrentSubtopic(subtopic);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subtopic?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subtopics?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete subtopic');
      }

      // Refresh the list
      const updatedSubtopics = subtopics.filter(st => st.subtopic_id !== id);
      setSubtopics(updatedSubtopics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = formMode === 'create' ? 'POST' : 'PUT';
      const response = await fetch('/api/admin/subtopics', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentSubtopic),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${formMode} subtopic`);
      }

      // Close form and refresh the list
      setIsFormOpen(false);
      
      if (selectedTopic) {
        const response = await fetch(`/api/admin/subtopics?topicId=${selectedTopic}`);
        if (response.ok) {
          const data = await response.json();
          setSubtopics(data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `An error occurred while ${formMode === 'create' ? 'creating' : 'updating'}`);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentSubtopic(prev => ({ ...prev, [name]: name === 'topic_id' ? Number(value) : value }));
  };

  const getTopicName = (topicId: number) => {
    const topic = topics.find(t => t.topic_id === topicId);
    return topic ? topic.topic_name : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subtopics Management</h1>
        <button 
          onClick={handleCreateClick}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={!selectedTopic}
        >
          Add New Subtopic
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Subject:
          </label>
          <select
            value={selectedSubject || ''}
            onChange={handleSubjectChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {subjects.length === 0 && <option value="">No subjects available</option>}
            {subjects.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.subject_name} ({subject.subject_code})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Topic:
          </label>
          <select
            value={selectedTopic?.toString() || ''}
            onChange={handleTopicChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {topics.length === 0 && <option value="">No topics available</option>}
            {topics.map((topic) => (
              <option key={topic.topic_id} value={topic.topic_id}>
                {topic.topic_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <p>Loading subtopics...</p>
      ) : !selectedTopic ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">Please select a topic to view its subtopics.</p>
        </div>
      ) : subtopics.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">No subtopics found for this topic. Create a new subtopic to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtopic Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subtopics.map((subtopic) => (
                <tr key={subtopic.subtopic_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{subtopic.subtopic_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{subtopic.subtopic_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getTopicName(subtopic.topic_id)}</td>
                  <td className="px-6 py-4">
                    {subtopic.description ? 
                      (subtopic.description.length > 50 ? 
                        `${subtopic.description.substring(0, 50)}...` : 
                        subtopic.description) : 
                      <span className="text-gray-400 italic">No description</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${subtopic.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {subtopic.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditClick(subtopic)} 
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(subtopic.subtopic_id)} 
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
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {formMode === 'create' ? 'Add New Subtopic' : 'Edit Subtopic'}
            </h2>
            
            <form onSubmit={handleFormSubmit}>
              {formMode === 'edit' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="topic_id">
                    Topic
                  </label>
                  <select
                    id="topic_id"
                    name="topic_id"
                    value={currentSubtopic.topic_id?.toString() || ''}
                    onChange={handleInputChange}
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
              )}
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subtopic_name">
                  Subtopic Name
                </label>
                <input
                  type="text"
                  id="subtopic_name"
                  name="subtopic_name"
                  value={currentSubtopic.subtopic_name || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={currentSubtopic.description || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                />
              </div>
              
              {formMode === 'edit' && (
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={currentSubtopic.is_active || false}
                      onChange={(e) => setCurrentSubtopic(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {formMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}