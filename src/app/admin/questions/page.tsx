// src/app/admin/questions/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import JsonUploader from '@/app/admin/components/JsonUploader';
import { 
  HeaderActions, 
  QuestionsFilters, 
 // QuestionsTable, 
  QuestionForm, 
  ViewQuestionModal, 
  Pagination, 
  ErrorMessage, 
  LoadingIndicator, 
  NoQuestionsFound,
} from '.';
import { DIFFICULTY_LEVELS, Question, QUESTION_TYPES, QuestionPaper, Subject, Subtopic, Topic } from './components/types';


export default function QuestionsPage() {
  // State Management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  
  // Loading and Error States
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
  
  // Form and Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewQuestion, 
    //setViewQuestion
  ] = useState<Question | null>(null);
  
  // JSON Uploader and Other States
  const [isJsonUploaderOpen, setIsJsonUploaderOpen] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [currentPaper, setCurrentPaper] = useState<QuestionPaper | null>(null);

  // Memoized Topic and Subtopic Name Retrieval
  const getTopicName = useCallback((topicId: number | null) => {
    if (!topicId) return 'None';
    if (!topics || topics.length === 0) return 'Loading...';
    const topic = topics.find(t => t.topic_id === topicId);
    return topic ? topic.topic_name : 'Unknown';
  }, [topics]);

  const getSubtopicName = useCallback((subtopicId: number | null) => {
    if (!subtopicId) return 'None';
    const subtopic = subtopics.find(s => s.subtopic_id === subtopicId);
    return subtopic ? subtopic.subtopic_name : 'Unknown';
  }, [subtopics]);

  // Fetch Initial Data (Subjects)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const subjectsResponse = await fetch('/api/admin/subjects');
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData);
          
          if (subjectsData.length > 0 && !selectedSubject) {
            setSelectedSubject(subjectsData[0].subject_id.toString());
          }
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load initial data');
      }
    };
    
    fetchInitialData();
  }, [selectedSubject]);

  // Fetch Topics when Subject Changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) return;
      
      try {
        const response = await fetch(`/api/admin/topics?subjectId=${Number(selectedSubject)}`);
        
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
          }
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics');
      }
    };
    
    fetchTopics();
  }, [selectedSubject, selectedTopic]);

  // Fetch Subtopics when Topic Changes
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
        console.error('Error fetching subtopics:', err);
        setError('Failed to load subtopics');
      }
    };
    
    fetchSubtopics();
  }, [selectedTopic, selectedSubtopic]);

  // Fetch Papers
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await fetch('/api/admin/question-papers');
        
        if (response.ok) {
          const data = await response.json();
          setPapers(data);
        }
      } catch (err) {
        console.error('Error fetching papers:', err);
      }
    };
    
    fetchPapers();
  }, []);

  // Check for Paper ID in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paperId = urlParams.get('paperId');
    
    if (paperId) {
      const id = Number(paperId);
      setSelectedPaperId(id);
      
      // Fetch the paper details
      const fetchPaper = async () => {
        try {
          const response = await fetch(`/api/admin/question-papers?id=${id}`);
          
          if (response.ok) {
            const paper = await response.json();
            setCurrentPaper(paper);
          }
        } catch (err) {
          console.error('Error fetching paper details:', err);
        }
      };
      
      fetchPaper();
    }
  }, []);

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/admin/questions?';
      
      if (selectedPaperId) {
        url += `paperId=${selectedPaperId}&`;
      } else if (selectedTopic) {
        url += `topicId=${selectedTopic}&`;
        
        if (selectedSubtopic) {
          url += `subtopicId=${selectedSubtopic}&`;
        }
      }
      
      // Add pagination
      url += `limit=${limit}&offset=${(page - 1) * limit}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        // Filter by question type if selected
        const filteredData = selectedType 
          ? data.filter((q: Question) => q.question_type === selectedType)
          : data;
          
        setQuestions(filteredData);
        setTotalQuestions(filteredData.length);
      } else {
        setError('Failed to load questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, selectedSubtopic, selectedPaperId, selectedType, page, limit]);

  // Trigger question fetch
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Event Handlers
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setPage(1);
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopic(e.target.value ? Number(e.target.value) : null);
    setPage(1);
  };

  const handleSubtopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubtopic(e.target.value ? Number(e.target.value) : null);
    setPage(1);
  };

  const handlePaperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedPaperId(value ? Number(value) : null);
    setPage(1);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setPage(1);
  };

  // Question Creation/Edit Handlers
  const handleCreateClick = () => {
    setCurrentQuestion({
      topic_id: selectedTopic,
      subtopic_id: selectedSubtopic,
      question_type: QUESTION_TYPES[0],
      difficulty_level: 'medium',
      marks: 1,
      is_image_based: false,
      is_active: true,
      question_number: 1
    });
    setFormMode('create');
    setIsFormOpen(true);
  };

  // const handleEditClick = async (id: number) => {
  //   try {
  //     const response = await fetch(`/api/admin/questions?id=${id}`);
      
  //     if (response.ok) {
  //       const question = await response.json();
  //       setCurrentQuestion(question);
  //       if (question.topic_id) {
  //         const subtopicsResponse = await fetch(`/api/admin/subtopics?topicId=${question.topic_id}`);
  //         if (subtopicsResponse.ok) {
  //           const subtopicsData = await subtopicsResponse.json();
  //           setSubtopics(subtopicsData);
  //         }
  //       }
  //       setFormMode('edit');
  //       setIsFormOpen(true);
  //     } else {
  //       setError('Failed to load question details');
  //     }
  //   } catch (err) {
  //     console.error('Error fetching question details:', err); 
  //     setError('Failed to load question details');
  //   }
  // };

  // const handleViewClick = async (id: number) => {
  //   try {
  //     const response = await fetch(`/api/admin/questions?id=${id}`);
      
  //     if (response.ok) {
  //       const question = await response.json();
  //       setViewQuestion(question);
  //       setIsViewModalOpen(true);
  //     } else {
  //       setError('Failed to load question details');
  //     }
  //   } catch (err) {
  //     console.error('Error fetching question details:', err); 
  //     setError('Failed to load question details');
  //   }
  // };

  // const handleDeleteClick = async (id: number) => {
  //   if (!confirm('Are you sure you want to delete this question?')) {
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`/api/admin/questions?id=${id}`, {
  //       method: 'DELETE',
  //     });

  //     if (response.ok) {
  //       // Update the list
  //       setQuestions(questions.filter(q => q.question_id !== id));
  //     } else {
  //       setError('Failed to delete question');
  //     }
  //   } catch (err) {
  //     console.error('Error deleting question:', err);
  //     setError('Failed to delete question');
  //   }
  // };

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
        await fetchQuestions();
      } else {
        setError(`Failed to ${formMode} question`);
      }
    } catch (err) {
      console.error(`Error ${formMode} question:`, err);
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

  return (
    <div>
      <HeaderActions 
        onJsonUpload={() => setIsJsonUploaderOpen(true)}
        onCreateQuestion={handleCreateClick}
        isQuestionCreationDisabled={!selectedTopic}
      />

      <QuestionsFilters 
        subjects={subjects}
        topics={topics}
        subtopics={subtopics}
        papers={papers}
        questionTypes={QUESTION_TYPES}
        selectedSubject={selectedSubject}
        selectedTopic={selectedTopic}
        selectedSubtopic={selectedSubtopic}
        selectedPaperId={selectedPaperId}
        selectedType={selectedType}
        currentPaper={currentPaper}
        onSubjectChange={handleSubjectChange}
        onTopicChange={handleTopicChange}
        onSubtopicChange={handleSubtopicChange}
        onPaperChange={handlePaperChange}
        onTypeChange={handleTypeChange}
      />

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingIndicator />
      ) : questions.length === 0 ? (
        <NoQuestionsFound />
      ) : (
        <>
          {/* <QuestionsTable 
            questions={questions}
            getTopicName={getTopicName}
            onViewClick={handleViewClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          /> */}
          
          <Pagination 
            currentPage={page}
            totalItems={totalQuestions}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        </>
      )}
      
      {/* JSON Uploader Modal */}
      {isJsonUploaderOpen && (
        <JsonUploader onClose={() => {
          setIsJsonUploaderOpen(false);
          fetchQuestions();
        }} />
      )}

      {/* Question Form Modal */}
      {isFormOpen && (
        <QuestionForm 
          currentQuestion={currentQuestion}
          topics={topics}
          subtopics={subtopics}
          papers={papers}
          questionTypes={QUESTION_TYPES}
          difficultyLevels={DIFFICULTY_LEVELS}
          formMode={formMode}
          onInputChange={handleInputChange}
          onSubmit={handleFormSubmit}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* View Question Modal */}
      {isViewModalOpen && viewQuestion && (
        <ViewQuestionModal 
          viewQuestion={viewQuestion}
          subjects={subjects}
          topics={topics}
          subtopics={subtopics}
          getTopicName={getTopicName}
          getSubtopicName={getSubtopicName}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </div>
  );
}