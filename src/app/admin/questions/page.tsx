// src/app/admin/questions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import JsonUploader from '@/app/admin/components/JsonUploader';

type Subject = {
  subject_id: number;
  subject_name: string;
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
};

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

const questionTypes = [
  'Multiple Choice',
  'Assertion Reason',
  'Match Columns',
  'Statement Based',
  'Subjective',
  'True/False'
];

const difficultyLevels = ['easy', 'medium', 'hard', 'very-hard'];

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);
  
  // JSON Uploader state
  const [isJsonUploaderOpen, setIsJsonUploaderOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch subjects
        const subjectsResponse = await fetch('/api/admin/subjects');
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData);
          
          if (subjectsData.length > 0 && !selectedSubject) {
            setSelectedSubject(subjectsData[0].subject_id.toString());
          }
        }
      } catch (err) {
        setError('Failed to load initial data');
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) return;
      
      try {
        const response = await fetch(`/api/admin/topics?subjectId=${selectedSubject}`);
        
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
          
          if (data.length > 0) {
            if (!selectedTopic || !data.some((t: Topic) => t.topic_id === selectedTopic)) {
              setSelectedTopic(data[0].topic_id);
            }
          } else {
            setSelectedTopic(null);
            setSelectedSubtopic(null);
            setSubtopics([]);
          }
        }
      } catch (err) {
        setError('Failed to load topics');
      }
    };
    
    fetchTopics();
  }, [selectedSubject]);

  // Fetch subtopics when topic changes
  useEffect(() => {
    const fetchSubtopics = async () => {
      if (!selectedTopic) {
        setSubtopics([]);
        return;
      }
      
      try {
        const response = await fetch(`/api/admin/subtopics?topicId=${selectedTopic}`);
        
        if (response.ok) {
          const data = await response.json();
          setSubtopics(data);
          
          if (data.length > 0) {
            if (!selectedSubtopic || !data.some((s: Subtopic) => s.subtopic_id === selectedSubtopic)) {
              setSelectedSubtopic(data[0].subtopic_id);
            }
          } else {
            setSelectedSubtopic(null);
          }
        }
      } catch (err) {
        setError('Failed to load subtopics');
      }
    };
    
    fetchSubtopics();
  }, [selectedTopic]);

  // Fetch questions based on filters
  useEffect(() => {
    fetchQuestions();
  }, [selectedTopic, selectedSubtopic, selectedType, page, limit]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setPage(1); // Reset pagination when filter changes
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopic(e.target.value ? Number(e.target.value) : null);
    setPage(1);
  };

  const handleSubtopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubtopic(e.target.value ? Number(e.target.value) : null);
    setPage(1);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setPage(1);
  };

  const handleCreateClick = () => {
    setCurrentQuestion({
      topic_id: selectedTopic,
      subtopic_id: selectedSubtopic,
      question_type: questionTypes[0],
      difficulty_level: 'medium',
      marks: 1,
      is_image_based: false,
      is_active: true,
      question_number: 1
    });
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEditClick = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/questions?id=${id}`);
      
      if (response.ok) {
        const question = await response.json();
        setCurrentQuestion(question);
        setFormMode('edit');
        setIsFormOpen(true);
      } else {
        setError('Failed to load question details');
      }
    } catch (err) {
      setError('Failed to load question details');
    }
  };

  const handleViewClick = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/questions?id=${id}`);
      
      if (response.ok) {
        const question = await response.json();
        setViewQuestion(question);
        setIsViewModalOpen(true);
      } else {
        setError('Failed to load question details');
      }
    } catch (err) {
      setError('Failed to load question details');
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/questions?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update the list
        setQuestions(questions.filter(q => q.question_id !== id));
      } else {
        setError('Failed to delete question');
      }
    } catch (err) {
      setError('Failed to delete question');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = formMode === 'create' ? 'POST' : 'PUT';
      const response = await fetch('/api/admin/questions', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentQuestion),
      });

      if (response.ok) {
        setIsFormOpen(false);
        
        // Refresh the questions list
        const refreshUrl = selectedSubtopic 
          ? `/api/admin/questions?subtopicId=${selectedSubtopic}` 
          : selectedTopic 
          ? `/api/admin/questions?topicId=${selectedTopic}` 
          : '/api/admin/questions';
          
        const refreshResponse = await fetch(refreshUrl);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setQuestions(refreshData);
        }
      } else {
        setError(`Failed to ${formMode} question`);
      }
    } catch (err) {
      setError(`Failed to ${formMode} question`);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setCurrentQuestion(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'topic_id' || name === 'subtopic_id' || name === 'marks' || name === 'question_number') {
      setCurrentQuestion(prev => ({ 
        ...prev, 
        [name]: value === '' ? null : Number(value) 
      }));
    } else {
      setCurrentQuestion(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleJsonUploaderClose = () => {
    setIsJsonUploaderOpen(false);
    
    // Refresh the questions list after upload
    fetchQuestions();
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/questions?';
      
      if (selectedTopic) {
        url += `topicId=${selectedTopic}&`;
      }
      
      if (selectedSubtopic) {
        url += `subtopicId=${selectedSubtopic}&`;
      }
      
      url += `limit=${limit}&offset=${(page - 1) * limit}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        const filteredData = selectedType 
          ? data.filter((q: Question) => q.question_type === selectedType)
          : data;
          
        setQuestions(filteredData);
        setTotalQuestions(filteredData.length);
      } else {
        setError('Failed to load questions');
      }
    } catch (err) {
      setError('Failed to refresh questions');
    } finally {
      setLoading(false);
    }
  };

  const getTopicName = (topicId: number | null) => {
    if (!topicId) return 'None';
    const topic = topics.find(t => t.topic_id === topicId);
    return topic ? topic.topic_name : 'Unknown';
  };

  const getSubtopicName = (subtopicId: number | null) => {
    if (!subtopicId) return 'None';
    const subtopic = subtopics.find(s => s.subtopic_id === subtopicId);
    return subtopic ? subtopic.subtopic_name : 'Unknown';
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalQuestions / limit);
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * limit, totalQuestions)}
              </span>{' '}
              of <span className="font-medium">{totalQuestions}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === pageNum
                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  page === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Questions Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsJsonUploaderOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Questions from JSON
          </button>
          <button 
            onClick={handleCreateClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={!selectedTopic}
          >
            Add New Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject:
            </label>
            <select
              value={selectedSubject || ''}
              onChange={handleSubjectChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic:
            </label>
            <select
              value={selectedTopic?.toString() || ''}
              onChange={handleTopicChange}
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtopic:
            </label>
            <select
              value={selectedSubtopic?.toString() || ''}
              onChange={handleSubtopicChange}
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Type:
            </label>
            <select
              value={selectedType}
              onChange={handleTypeChange}
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
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <p>Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">No questions found with the current filters.</p>
        </div>
      ) : (
        <>
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
                        onClick={() => handleViewClick(question.question_id)} 
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditClick(question.question_id)} 
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(question.question_id)} 
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
          
          {renderPagination()}
        </>
      )}
      
      {/* JSON Uploader Modal */}
      {isJsonUploaderOpen && (
        <JsonUploader onClose={handleJsonUploaderClose} />
      )}

      {/* Question Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {formMode === 'create' ? 'Add New Question' : 'Edit Question'}
            </h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="topic_id">
                    Topic
                  </label>
                  <select
                    id="topic_id"
                    name="topic_id"
                    value={currentQuestion.topic_id?.toString() || ''}
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="subtopic_id">
                    Subtopic
                  </label>
                  <select
                    id="subtopic_id"
                    name="subtopic_id"
                    value={currentQuestion.subtopic_id?.toString() || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">None</option>
                    {subtopics.map((subtopic) => (
                      <option key={subtopic.subtopic_id} value={subtopic.subtopic_id}>
                        {subtopic.subtopic_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="question_type">
                    Question Type
                  </label>
                  <select
                    id="question_type"
                    name="question_type"
                    value={currentQuestion.question_type || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    {questionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="difficulty_level">
                    Difficulty Level
                  </label>
                  <select
                    id="difficulty_level"
                    name="difficulty_level"
                    value={currentQuestion.difficulty_level || 'medium'}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    {difficultyLevels.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="marks">
                    Marks
                  </label>
                  <input
                    type="number"
                    id="marks"
                    name="marks"
                    min="1"
                    value={currentQuestion.marks || 1}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="question_number">
                    Question Number
                  </label>
                  <input
                    type="number"
                    id="question_number"
                    name="question_number"
                    min="1"
                    value={currentQuestion.question_number || 1}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="question_text">
                  Question Text
                </label>
                <textarea
                  id="question_text"
                  name="question_text"
                  value={currentQuestion.question_text || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="explanation">
                  Explanation (Optional)
                </label>
                <textarea
                  id="explanation"
                  name="explanation"
                  value={currentQuestion.explanation || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_image_based"
                  name="is_image_based"
                  checked={currentQuestion.is_image_based || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_image_based" className="ml-2 block text-sm text-gray-900">
                  Image-based question
                </label>
              </div>
              
              {currentQuestion.is_image_based && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="image_url">
                    Image URL
                  </label>
                  <input
                    type="text"
                    id="image_url"
                    name="image_url"
                    value={currentQuestion.image_url || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={currentQuestion.is_active ?? true} // Default to true if undefined
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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
      )}

      {/* View Question Modal */}
      {isViewModalOpen && viewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">View Question Details (ID: {viewQuestion.question_id})</h2>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <p><strong>Subject:</strong> {subjects.find(s => s.subject_id === Number(topics.find(t => t.topic_id === viewQuestion.topic_id)?.subject_id))?.subject_name || 'N/A'}</p>
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
                  <img src={viewQuestion.image_url} alt="Question Image" className="max-w-full h-auto mt-1 border rounded" />
                </div>
              )}
              <div className="mt-2">
                <strong className="block mb-1">Question Text:</strong>
                <div className="prose prose-sm max-w-none p-2 border rounded bg-gray-50" dangerouslySetInnerHTML={{ __html: viewQuestion.question_text }}></div>
              </div>
              {viewQuestion.explanation && (
                <div className="mt-2">
                  <strong className="block mb-1">Explanation:</strong>
                  <div className="prose prose-sm max-w-none p-2 border rounded bg-gray-50" dangerouslySetInnerHTML={{ __html: viewQuestion.explanation }}></div>
                </div>
              )}
              <p><strong>Created At:</strong> {new Date(viewQuestion.created_at).toLocaleString()}</p>
              <p><strong>Updated At:</strong> {new Date(viewQuestion.updated_at).toLocaleString()}</p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
