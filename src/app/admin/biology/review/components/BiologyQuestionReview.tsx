// src/app/admin/biology/review/components/BiologyQuestionReview.tsx
"use client";

import { useState, useEffect } from 'react';
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
import { Pagination } from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import React from 'react';

// Type definitions based on your database schema
interface Subject {
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [filteredSubtopics, setFilteredSubtopics] = useState<Subtopic[]>([]);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // State for filters
  const [filters, setFilters] = useState<Filters>({
    topic_id: null,
    subtopic_id: null,
    difficulty_level: null,
    question_type: null,
    searchTerm: '',
  });
  
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch biology topics
        const topicsResponse = await fetch('/api/admin/topics?subject_id=1');
        const topicsData = await topicsResponse.json();
        setTopics(topicsData);
        
        // Fetch all subtopics for biology
        const subtopicsResponse = await fetch('/api/admin/subtopics?subject_id=1');
        const subtopicsData = await subtopicsResponse.json();
        setSubtopics(subtopicsData);
        
        // Fetch questions (first page)
        await fetchQuestions();
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Update filtered subtopics when topic changes
  useEffect(() => {
    if (filters.topic_id) {
      const filtered = subtopics.filter(
        (subtopic) => subtopic.topic_id === filters.topic_id
      );
      setFilteredSubtopics(filtered);
    } else {
      setFilteredSubtopics([]);
    }
    // Reset subtopic selection when topic changes
    setFilters(prev => ({ ...prev, subtopic_id: null }));
  }, [filters.topic_id, subtopics]);
  
  // Fetch questions with current filters and pagination
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('subject_id', '1'); // Biology
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      if (filters.topic_id) params.append('topic_id', filters.topic_id.toString());
      if (filters.subtopic_id) params.append('subtopic_id', filters.subtopic_id.toString());
      if (filters.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
      if (filters.question_type) params.append('question_type', filters.question_type);
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      
      const response = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await response.json();
      
      setQuestions(data.questions);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };
  
  // Apply filters when they change
  useEffect(() => {
    fetchQuestions();
  }, [currentPage, pageSize, filters]);
  
  // Render question content based on type
  const renderQuestionContent = (question: Question) => {
    switch (question.question_type) {
      case 'MultipleChoice':
        return (
          <div className="space-y-4">
            <div className="font-medium">{question.question_text}</div>
            {question.details.options && (
              <div className="grid gap-2">
                {question.details.options.map((option, idx) => (
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
            {question.details.statements && (
              <div className="grid gap-2">
                {question.details.statements.map((statement, idx) => (
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
            {question.details.assertion_text && (
              <div className="p-2 rounded-md bg-blue-50">
                <span className="font-semibold">Assertion: </span>
                {question.details.assertion_text}
              </div>
            )}
            {question.details.reason_text && (
              <div className="p-2 rounded-md bg-purple-50">
                <span className="font-semibold">Reason: </span>
                {question.details.reason_text}
              </div>
            )}
          </div>
        );
        
      case 'Matching':
        return (
          <div className="space-y-4">
            <div className="font-medium">{question.question_text}</div>
            {question.details.items && question.details.items.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">{question.details.left_column_header || 'Column A'}</div>
                <div className="font-semibold">{question.details.right_column_header || 'Column B'}</div>
                {question.details.items.map((item, idx) => (
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
            {question.details.intro_text && (
              <div className="italic">{question.details.intro_text}</div>
            )}
            {question.details.items && (
              <div className="grid gap-2">
                {question.details.items.map((item, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    {item.item_label || item.item_number}. {item.item_text}
                  </div>
                ))}
              </div>
            )}
            {question.details.correct_sequence && (
              <div>
                <span className="font-semibold">Correct sequence: </span>
                {Array.isArray(question.details.correct_sequence) 
                  ? question.details.correct_sequence.join(' → ') 
                  : question.details.correct_sequence}
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
                value={filters.topic_id?.toString() || ""}
                onValueChange={(value) => handleFilterChange('topic_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger id="topic">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Topics</SelectItem>
                  {topics.map((topic) => (
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
                value={filters.subtopic_id?.toString() || ""}
                onValueChange={(value) => handleFilterChange('subtopic_id', value ? parseInt(value) : null)}
                disabled={!filters.topic_id}
              >
                <SelectTrigger id="subtopic">
                  <SelectValue placeholder={filters.topic_id ? "Select a subtopic" : "Select a topic first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subtopics</SelectItem>
                  {filteredSubtopics.map((subtopic) => (
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
                value={filters.difficulty_level || ""}
                onValueChange={(value) => handleFilterChange('difficulty_level', value || null)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <Select
                value={filters.question_type || ""}
                onValueChange={(value) => handleFilterChange('question_type', value || null)}
              >
                <SelectTrigger id="questionType">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Type</SelectItem>
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
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
                <Button type="submit">Search</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Questions List */}
      {isLoading ? (
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
          {questions.map((question) => (
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
                      <div className="mb-4">
                        <img 
                          src={question.image_url} 
                          alt="Question Image" 
                          className="max-h-64 object-contain mx-auto"
                        />
                      </div>
                    )}
                    {renderQuestionContent(question)}
                  </TabsContent>
                  
                  <TabsContent value="explanation" className="pt-4">
                    {question.explanation ? (
                      <div className="prose max-w-none">
                        {question.explanation}
                      </div>
                    ) : (
                      <div className="italic text-gray-500">No explanation provided</div>
                    )}
                  </TabsContent>
                </Tabs>
                
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, (totalPages * pageSize))} of {totalPages * pageSize} questions
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                  // Calculate the page number to display
                  let pageNum = currentPage;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
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
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
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
        </div>
      )}
    </div>
  );
}
