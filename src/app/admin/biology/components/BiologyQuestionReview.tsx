// src/app/admin/biology/components/BiologyQuestionReview.tsx
"use client";

import React from 'react';

import Image from 'next/image';
import { LaTeXRenderer } from '@/components/ui/LaTeXRenderer';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import EditQuestionModal from './EditQuestionModal';
import { toast } from "@/components/ui/use-toast";


// Type definitions based on your database schema
interface Topic {
  topic_id: number;
  subject_id: number;
  topic_name: string;
  parent_topic_id: number | null;
  description: string | null;
}

interface Subtopic {
  subtopic_id: number;
  topic_id: number;
  subtopic_name: string;
  description: string | null;
}

interface QuestionOption {
  option_number: string | number;
  option_text: string;
  is_correct: boolean;
}

interface QuestionStatement {
  statement_label: string;
  statement_text: string;
  is_correct: boolean;
}

interface QuestionDetails {
  options?: QuestionOption[];
  statements?: QuestionStatement[];
  assertion_text?: string;
  reason_text?: string;
  left_column_header?: string;
  right_column_header?: string;
  items?: Array<{
    left_item_label?: string;
    left_item_text?: string;
    right_item_label?: string;
    right_item_text?: string;
    item_number?: number;
    item_label?: string;
    item_text?: string;
  }>;
  intro_text?: string;
  correct_option?: number | string;
  correct_sequence?: string | number[];
}

interface Question {
  question_id: number;
  paper_id: number | null;
  subject_id: number;
  topic_id: number;
  subtopic_id: number | null;
  question_number: number;
  question_type: 'MultipleChoice' | 'Matching' | 'MultipleCorrectStatements' | 'AssertionReason' | 'DiagramBased' | 'SequenceOrdering';
  source_type: 'PreviousYear' | 'AI_Generated' | 'Other';
  question_text: string;
  explanation: string | null;
  details: QuestionDetails;
  difficulty_level: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: number;
  is_image_based: boolean;
  image_url: string | null;
}

interface Filters {
  topic_id: number | null;
  subtopic_id: number | null;
  difficulty_level: string | null;
  question_type: string | null;
  searchTerm: string;
}

export default function BiologyQuestionReview() {
  // State for data
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [subtopics, setSubtopics] = React.useState<Subtopic[]>([]);
  const [filteredSubtopics, setFilteredSubtopics] = React.useState<Subtopic[]>([]);
  
  // State for pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);

  // State for filters
  const [filters, setFilters] = React.useState<Filters>({
    topic_id: null,
    subtopic_id: null,
    difficulty_level: null,
    question_type: null,
    searchTerm: '',
  });
  
  // State for loading
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  // References to prevent multiple fetches
  const initialDataFetched = React.useRef(false);
  const isFetchingQuestions = React.useRef(false);
  
  // Fetch questions with current filters and pagination
  const fetchQuestions = React.useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingQuestions.current) {
      return;
    }
    
    // Skip if not authenticated
    if (!isSignedIn) {
      return;
    }
    
    isFetchingQuestions.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('subjectId', '3'); // Biology
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());

      if (filters.topic_id) params.append('topicId', filters.topic_id.toString());
      if (filters.subtopic_id) params.append('subtopicId', filters.subtopic_id.toString());
      if (filters.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
      if (filters.question_type) params.append('question_type', filters.question_type);
      if (filters.searchTerm) params.append('search', filters.searchTerm);

      const response = await fetch(`/api/admin/questions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const data = await response.json();

      // Check if the response has the expected structure
      if (!data || !Array.isArray(data.questions)) {
        // Handle case where the API doesn't return the expected data structure
        if (Array.isArray(data)) {
          // If data is an array directly, use it as questions
          setQuestions(data);
          setTotalItems(data.length);
          setTotalPages(Math.ceil(data.length / pageSize));
        } else {
          // If data has unexpected structure or is empty
          setQuestions([]);
          setTotalItems(0);
          setTotalPages(1);
          console.warn('Unexpected data structure returned from API', data);
        }
      } else {
        // Normal case where API returns expected structure
        setQuestions(data.questions);
        setTotalItems(data.total || data.questions.length);
        setTotalPages(Math.ceil((data.total || data.questions.length) / pageSize));
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch questions');
      setQuestions([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      isFetchingQuestions.current = false;
    }
  }, [currentPage, pageSize, filters, isSignedIn]);

  // Fetch initial data (topics and subtopics)
  const fetchInitialData = React.useCallback(async () => {
    if (!isSignedIn || initialDataFetched.current) {
      return;
    }
    
    setIsLoading(true);
    initialDataFetched.current = true;
    
    try {
      // Fetch biology topics
      const topicsResponse = await fetch('/api/admin/topics?subjectId=3');
      if (!topicsResponse.ok) {
        throw new Error('Failed to fetch topics');
      }
      const topicsData = await topicsResponse.json();
      setTopics(topicsData);
      
      // Fetch all subtopics for biology
      const subtopicsResponse = await fetch('/api/admin/subtopics?subjectId=3');
      if (!subtopicsResponse.ok) {
        throw new Error('Failed to fetch subtopics');
      }
      const subtopicsData = await subtopicsResponse.json();
      setSubtopics(subtopicsData);
      
      // Now fetch questions
      await fetchQuestions();
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  }, [fetchQuestions, isSignedIn]);

  // Redirect unauthenticated users
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);
  
  // Fetch initial data once when auth loads
  React.useEffect(() => {
    if (isLoaded && isSignedIn && !initialDataFetched.current) {
      fetchInitialData();
    }
  }, [isLoaded, isSignedIn, fetchInitialData]);

  // This effect controls when to fetch questions due to filter/pagination changes
  React.useEffect(() => {
    // Only run if we're authenticated and initial data is already loaded
    if (isLoaded && isSignedIn && initialDataFetched.current && !isFetchingQuestions.current) {
      // Use a short timeout to debounce multiple rapid changes
      const timeoutId = setTimeout(() => {
        fetchQuestions();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, pageSize, filters, isLoaded, isSignedIn, fetchQuestions]);
  
  // Update filtered subtopics when topic changes
  React.useEffect(() => {
    if (filters.topic_id) {
      const filtered = subtopics.filter(
        (subtopic: { topic_id: number }) => subtopic.topic_id === filters.topic_id
      );
      setFilteredSubtopics(filtered);
      // Reset subtopic selection when topic changes  
      if (filters.subtopic_id) {
        setFilters((prev: Filters) => ({ ...prev, subtopic_id: null }));
      }
    } else {
      setFilteredSubtopics([]);
    }
  }, [filters.topic_id, filters.subtopic_id, subtopics]);

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string | number | null) => {
    setFilters((prev: Filters) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  const handleEditClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditModalOpen(true);
  };
  // Handle save question
  const handleSaveQuestion = async (updatedQuestion: Question) => {
    try {
      const response = await fetch(`/api/admin/questions/${updatedQuestion.question_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedQuestion),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update question');
      }
      // Update the question in the local state
      setQuestions((prevQuestions: Question[]) => 
        prevQuestions.map((q: Question) => 
          q.question_id === updatedQuestion.question_id ? updatedQuestion : q
        )
      );
      
      // Show success toast
      toast({
        title: "Question Updated",
        description: "The question has been successfully updated.",
      });
      
    } catch (error) {
      console.error('Error updating question:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };
  // Handle search - with explicit user action to prevent automatic refetching
  const handleSearch = (e: { preventDefault: () => void, target: HTMLFormElement }) => {
    e.preventDefault();
    if (!isFetchingQuestions.current) {
      fetchQuestions();
    }
  };

  // If auth is still loading, show a loading state
  if (!isLoaded) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Render question content based on type
  const renderQuestionContent = (question: Question) => {
    if (!question) return null;
    
    const details = question.details || {};
    
    switch (question.question_type) {
      case 'MultipleChoice':
        return (
          <div className="space-y-4">
            <div className="font-medium">{question.question_text}</div>
            {details.options && details.options.length > 0 && (
              <div className="grid gap-2">
                {details.options.map((option, idx) => (
                  <div key={idx} className={`flex items-start p-2 rounded-md ${option.is_correct ? 'bg-green-50 border border-green-200' : ''}`}>
                    <div className="font-semibold mr-2">{option.option_number}.</div>
                    <div>{option.option_text}</div>
                    {option.is_correct && <Badge className="ml-auto">Correct</Badge>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'MultipleCorrectStatements':
        return (
          <div className="space-y-4">
            <div className="font-medium">{question.question_text}</div>
            {details.statements && details.statements.length > 0 && (
              <div className="grid gap-2">
                {details.statements.map((statement, idx) => (
                  <div key={idx} className={`flex items-start p-2 rounded-md ${statement.is_correct ? 'bg-green-50 border border-green-200' : ''}`}>
                    <div className="font-semibold mr-2">{statement.statement_label}.</div>
                    <div>{statement.statement_text}</div>
                    {statement.is_correct && <Badge className="ml-auto">Correct</Badge>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'AssertionReason':
        return (
          <div className="space-y-4">
            <div className="font-medium">{question.question_text}</div>
            {details.assertion_text && (
              <div className="p-2 rounded-md bg-blue-50">
                <span className="font-semibold">Assertion: </span>
                {details.assertion_text}
              </div>
            )}
            {details.reason_text && (
              <div className="p-2 rounded-md bg-purple-50">
                <span className="font-semibold">Reason: </span>
                {details.reason_text}
              </div>
            )}
          </div>
        );
        
      case 'Matching':
        return (
          <div className="space-y-4">
            <div className="font-medium">{question.question_text}</div>
            {details.items && details.items.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">{details.left_column_header || 'Column A'}</div>
                <div className="font-semibold">{details.right_column_header || 'Column B'}</div>
                {details.items.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <div className="p-2 bg-gray-50 rounded">
                      {item.left_item_label}. {item.left_item_text}
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      {item.right_item_label}. {item.right_item_text}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'SequenceOrdering':
        return (
          <div className="space-y-4">
            <div className="font-medium">{question.question_text}</div>
            {details.intro_text && (
              <div className="italic">{details.intro_text}</div>
            )}
            {details.items && details.items.length > 0 && (
              <div className="grid gap-2">
                {details.items.map((item, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    {item.item_label || item.item_number}. {item.item_text}
                  </div>
                ))}
              </div>
            )}
            {details.correct_sequence && (
              <div>
                <span className="font-semibold">Correct sequence: </span>
                {Array.isArray(details.correct_sequence) 
                  ? details.correct_sequence.join(' → ') 
                  : details.correct_sequence}
              </div>
            )}
          </div>
        );
        
      default:
        return <div className="font-medium">{question.question_text}</div>;
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Biology Question Review</h1>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Select
                value={filters.topic_id?.toString() || undefined}
                onValueChange={(value: string) => handleFilterChange('topic_id', value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger id="topic">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic: { topic_id: number; topic_name: string }) => (
                    <SelectItem key={topic.topic_id} value={topic.topic_id.toString()}>
                      {topic.topic_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtopic">Subtopic</Label>
              <Select
                value={filters.subtopic_id?.toString() || undefined}
                onValueChange={(value: string) => handleFilterChange('subtopic_id', value === "all" ? null : parseInt(value))}
                disabled={!filters.topic_id}
              >
                <SelectTrigger id="subtopic">
                  <SelectValue placeholder={filters.topic_id ? "Select a subtopic" : "Select a topic first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subtopics</SelectItem>
                  {filteredSubtopics.map((subtopic: { subtopic_id: number; subtopic_name: string }) => (
                    <SelectItem key={subtopic.subtopic_id} value={subtopic.subtopic_id.toString()}>
                      {subtopic.subtopic_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={filters.difficulty_level || undefined}
                onValueChange={(value: string) => handleFilterChange('difficulty_level', value === "any" ? null : value)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <Select
                value={filters.question_type || undefined}
                onValueChange={(value: string) => handleFilterChange('question_type', value === "any" ? null : value)}
              >
                <SelectTrigger id="questionType">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Type</SelectItem>
                  <SelectItem value="MultipleChoice">Multiple Choice</SelectItem>
                  <SelectItem value="Matching">Matching</SelectItem>
                  <SelectItem value="MultipleCorrectStatements">Multiple Correct Statements</SelectItem>
                  <SelectItem value="AssertionReason">Assertion Reason</SelectItem>
                  <SelectItem value="DiagramBased">Diagram Based</SelectItem>
                  <SelectItem value="SequenceOrdering">Sequence Ordering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search questions..."
                  value={filters.searchTerm}
                  onChange={(e: { target: { value: string } }) => handleFilterChange('searchTerm', e.target.value)}
                />
                <Button type="submit" disabled={isFetchingQuestions.current}>Search</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Status Card - Only visible during development, can be removed for production */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Authentication:</strong> {isSignedIn ? 'Signed In' : 'Not Signed In'}</p>
          <p><strong>Loading:</strong> {isLoading ? 'Loading data...' : 'Data loaded'}</p>
          <p><strong>Data Counts:</strong> Topics: {topics.length}, Subtopics: {subtopics.length}, Questions: {questions.length}</p>
          {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
        </CardContent>
      </Card>
      
      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Questions List */}
      {isLoading && questions.length === 0 ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>No questions found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question: Question) => (
            <Card key={question.question_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Question #{question.question_number}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{question.question_type}</Badge>
                    <Badge variant={
                      question.difficulty_level === 'easy' ? 'default' :
                      question.difficulty_level === 'medium' ? 'secondary' :
                      'destructive'
                    }>
                      {question.difficulty_level}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  ID: {question.question_id} • Marks: {question.marks} • Negative: {question.negative_marks}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="question">
                  <TabsList>
                    <TabsTrigger value="question">Question</TabsTrigger>
                    <TabsTrigger value="explanation">Explanation</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="question" className="pt-4">
                    {question.is_image_based && question.image_url && (
                      <div className="mb-4 relative h-64 w-full">
                        <Image
                          src={question.image_url}
                          alt="Question Image"
                          fill
                          style={{ objectFit: 'contain' }}
                          className="mx-auto"
                        />
                      </div>
                    )}
                    {renderQuestionContent(question)}
                  </TabsContent>
                  
                  <TabsContent value="explanation" className="pt-4">
                    {question.explanation ? (
                      <div className="prose max-w-none">
                        <LaTeXRenderer 
                          content={question.explanation}
                          className="prose dark:prose-invert max-w-none"
                        />
                      </div>
                    ) : (
                      <div className="italic text-gray-500">No explanation provided</div>
                    )}
                  </TabsContent>
                </Tabs>
                
                <div className="mt-4 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditClick(question)}
                >
                  Edit
                </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          {!isLoading && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {totalItems > 0 ? (
                  <>
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} questions
                  </>
                ) : (
                  'No questions found'
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                    // Calculate the page number to display
                    let pageNum = currentPage;
                    if (totalPages <= 5 || currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - (4 - idx);
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <Button
                        key={idx}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
                
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value: string) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Edit Question Modal */}
      <EditQuestionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        question={selectedQuestion}
        topics={topics}
        subtopics={subtopics}
        onSave={handleSaveQuestion}
      />
    </div>  
  );
}
