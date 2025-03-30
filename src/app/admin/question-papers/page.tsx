// src/app/admin/question-papers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Subject = {
  subject_id: number;
  subject_name: string;
  subject_code: string;
};

type QuestionPaper = {
  paper_id: number;
  paper_year: number;
  paper_code: string | null;
  subject: string;
  section: string | null;
  total_questions: number | null;
  max_marks: number | null;
  time_duration_minutes: number | null;
  source: string | null;
  upload_date: string;
};

export default function QuestionPapersPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentPaper, setCurrentPaper] = useState<Partial<QuestionPaper>>({});

  // Filters
  const [yearFilter, setYearFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');

  // Fetch papers and subjects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch question papers
        const papersResponse = await fetch('/api/admin/question-papers');
        
        if (!papersResponse.ok) {
          throw new Error('Failed to fetch question papers');
        }
        
        const papersData = await papersResponse.json();
        setPapers(papersData);
        
        // Fetch subjects for dropdown
        const subjectsResponse = await fetch('/api/admin/subjects');
        
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCreateClick = () => {
    const currentYear = new Date().getFullYear();
    setCurrentPaper({
      paper_year: currentYear,
      subject: subjects.length > 0 ? subjects[0].subject_name : '',
    });
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEditClick = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/question-papers?id=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch paper details');
      }
      
      const paper = await response.json();
      setCurrentPaper(paper);
      setFormMode('edit');
      setIsFormOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question paper? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/question-papers?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete question paper');
      }

      // Refresh the list
      setPapers(papers.filter(paper => paper.paper_id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    }
  };

  const handleViewQuestionsClick = (paperId: number) => {
    router.push(`/admin/questions?paperId=${paperId}`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = formMode === 'create' ? 'POST' : 'PUT';
      const response = await fetch('/api/admin/question-papers', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentPaper),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${formMode} question paper`);
      }

      // Close form and refresh the list
      setIsFormOpen(false);
      
      const refreshResponse = await fetch('/api/admin/question-papers');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setPapers(refreshData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `An error occurred while ${formMode === 'create' ? 'creating' : 'updating'}`);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Convert numeric fields
    if (['paper_year', 'total_questions', 'max_marks', 'time_duration_minutes'].includes(name)) {
      setCurrentPaper(prev => ({ 
        ...prev, 
        [name]: value === '' ? null : Number(value) 
      }));
    } else {
      setCurrentPaper(prev => ({ ...prev, [name]: value }));
    }
  };

  // Filter papers based on filters
  const filteredPapers = papers.filter(paper => {
    return (
      (yearFilter === '' || paper.paper_year.toString() === yearFilter) &&
      (subjectFilter === '' || paper.subject.toLowerCase().includes(subjectFilter.toLowerCase()))
    );
  });

  // Get unique years for filter
  const years = [...new Set(papers.map(paper => paper.paper_year))].sort((a, b) => b - a);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Question Papers Management</h1>
        <button 
          onClick={handleCreateClick}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Question Paper
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year:
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject:
            </label>
            <input
              type="text"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              placeholder="Filter by subject..."
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading question papers...</p>
      ) : filteredPapers.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">No question papers found. Create a new paper to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Marks</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPapers.map((paper) => (
                <tr key={paper.paper_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{paper.paper_year}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{paper.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{paper.paper_code || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{paper.section || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{paper.total_questions || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{paper.max_marks || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {paper.time_duration_minutes 
                      ? `${paper.time_duration_minutes} mins` 
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewQuestionsClick(paper.paper_id)} 
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Questions
                    </button>
                    <button 
                      onClick={() => handleEditClick(paper.paper_id)} 
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(paper.paper_id)} 
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {formMode === 'create' ? 'Add New Question Paper' : 'Edit Question Paper'}
            </h2>
            
            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paper_year">
                    Year*
                  </label>
                  <input
                    type="number"
                    id="paper_year"
                    name="paper_year"
                    value={currentPaper.paper_year || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject">
                    Subject*
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={currentPaper.subject || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                    list="subjectList"
                  />
                  <datalist id="subjectList">
                    {subjects.map((subject) => (
                      <option key={subject.subject_id} value={subject.subject_name} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paper_code">
                    Paper Code
                  </label>
                  <input
                    type="text"
                    id="paper_code"
                    name="paper_code"
                    value={currentPaper.paper_code || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="section">
                    Section
                  </label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    value={currentPaper.section || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="total_questions">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    id="total_questions"
                    name="total_questions"
                    value={currentPaper.total_questions || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="max_marks">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    id="max_marks"
                    name="max_marks"
                    value={currentPaper.max_marks || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="time_duration_minutes">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="time_duration_minutes"
                    name="time_duration_minutes"
                    value={currentPaper.time_duration_minutes || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="source">
                    Source
                  </label>
                  <input
                    type="text"
                    id="source"
                    name="source"
                    value={currentPaper.source || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
              
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