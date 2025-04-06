// src/app/admin/topics/page.tsx
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
  parent_topic_id: number | null;
  description: string | null;
  is_active: boolean;
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [parentTopics, setParentTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentTopic, setCurrentTopic] = useState<Partial<Topic>>({});

  // Fetch subjects and topics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch subjects
        const subjectsResponse = await fetch('/api/admin/subjects');
        if (!subjectsResponse.ok) {
          throw new Error('Failed to fetch subjects');
        }
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData);
        
        // If there are subjects, set selectedSubject to the first one if not already set
        if (subjectsData.length > 0 && !selectedSubject) {
          setSelectedSubject(subjectsData[0].subject_id.toString());
          await fetchTopics(subjectsData[0].subject_id.toString());
        } else if (selectedSubject) {
          await fetchTopics(selectedSubject);
        } else {
          setTopics([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedSubject]);

  // Effect to handle selectedSubject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchTopics = async (subjectId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = subjectId 
        ? `/api/admin/topics?subjectId=${subjectId}` 
        : '/api/admin/topics';
      
      console.log('Fetching topics from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      
      const data = await response.json();
      console.log('Topics fetched:', data);
      setTopics(data);
      
      // Set available parent topics (exclude non-active ones)
      setParentTopics(data.filter((topic: Topic) => topic.is_active));
      
    } catch (err) {
      console.error('Error in fetchTopics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleCreateClick = () => {
    // Make sure we have a subject selected
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0].subject_id.toString());
    }
    
    // Initialize the form with the selected subject
    setCurrentTopic({
      subject_id: selectedSubject || subjects[0]?.subject_id.toString() || '',
      topic_name: '',
      description: '',
      parent_topic_id: null,
      is_active: true
    });
    
    setFormMode('create');
    setIsFormOpen(true);
    console.log('Create topic form opened with subject:', selectedSubject);
  };

  const handleEditClick = (topic: Topic) => {
    setCurrentTopic({...topic});
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm('Are you sure you want to delete this topic?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/topics?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete topic');
      }

      // Refresh the list
      fetchTopics(selectedSubject);
    } catch (err) {
      console.error('Error in handleDeleteClick:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTopic.subject_id || !currentTopic.topic_name) {
      setError('Subject and topic name are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const method = formMode === 'create' ? 'POST' : 'PUT';
      console.log(`Submitting form with method ${method}:`, currentTopic);
      
      const response = await fetch('/api/admin/topics', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentTopic),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${formMode} topic`);
      }

      // Close form and refresh the list
      setIsFormOpen(false);
      fetchTopics(selectedSubject);
    } catch (err) {
      console.error('Error in handleFormSubmit:', err);
      setError(err instanceof Error ? err.message : `An error occurred while ${formMode === 'create' ? 'creating' : 'updating'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle special case for parent_topic_id to convert empty string to null
    if (name === 'parent_topic_id') {
      setCurrentTopic(prev => ({ 
        ...prev, 
        [name]: value === '' ? null : Number(value) 
      }));
    } else {
      setCurrentTopic(prev => ({ ...prev, [name]: value }));
    }
  };

  const getParentTopicName = (parentId: number | null) => {
    if (!parentId) return 'None';
    const parent = parentTopics.find(topic => topic.topic_id === parentId);
    return parent ? parent.topic_name : 'Unknown';
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.subject_id.toString() === subjectId);
    return subject ? subject.subject_name : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Topics Management</h1>
        <button 
          onClick={handleCreateClick}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Topic
        </button>
      </div>

      {/* Subject Filter */}
      {subjects.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Subject:
          </label>
          <select
            value={selectedSubject || ''}
            onChange={handleSubjectChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {subjects.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.subject_name} ({subject.subject_code})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <p>Loading topics...</p>
      ) : topics.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">No topics found. Create a new topic to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Topic</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topics.map((topic) => (
                <tr key={topic.topic_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{topic.topic_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{topic.topic_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getSubjectName(topic.subject_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getParentTopicName(topic.parent_topic_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${topic.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {topic.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditClick(topic)} 
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(topic.topic_id)} 
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
              {formMode === 'create' ? 'Add New Topic' : 'Edit Topic'}
            </h2>
            
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject_id">
                  Subject
                </label>
                <select
                  id="subject_id"
                  name="subject_id"
                  value={currentTopic.subject_id || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select a Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name} ({subject.subject_code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="topic_name">
                  Topic Name
                </label>
                <input
                  type="text"
                  id="topic_name"
                  name="topic_name"
                  value={currentTopic.topic_name || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="parent_topic_id">
                  Parent Topic (Optional)
                </label>
                <select
                  id="parent_topic_id"
                  name="parent_topic_id"
                  value={currentTopic.parent_topic_id?.toString() || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">None</option>
                  {parentTopics
                    .filter(t => t.topic_id !== currentTopic.topic_id) // Can't be its own parent
                    .map((topic) => (
                      <option key={topic.topic_id} value={topic.topic_id}>
                        {topic.topic_name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={currentTopic.description || ''}
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
                      checked={currentTopic.is_active || false}
                      onChange={(e) => setCurrentTopic(prev => ({ ...prev, is_active: e.target.checked }))}
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