// src/app/admin/biology/questions/components/QuestionForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Import our custom components
import { useToast } from "@/hooks/useToast";
import { 
  questionFormSchema, 
  QuestionFormValues,
  Topic,
  Subtopic
} from "./QuestionFormTypes";
import MultipleChoiceFields from "./question-types/MultipleChoiceFields";
import MultipleCorrectStatementsFields from "./question-types/MultipleCorrectStatementsFields";
import AssertionReasonFields from "./question-types/AssertionReasonFields";
import MatchingFields from "./question-types/MatchingFields";
import SequenceOrderingFields from "./question-types/SequenceOrderingFields";
import { 
  Option, 
  Statement, 
  AssertionReason, 
  MatchingItem, 
  MatchingHeaders,
  SequenceItem,
  SequenceInfo
} from "./question-types/TypeInterfaces";

interface QuestionFormProps {
  questionId?: number;
  isEdit?: boolean;
}

export default function QuestionForm({ questionId, isEdit = false }: QuestionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [filteredSubtopics, setFilteredSubtopics] = useState<Subtopic[]>([]);
  
  // State for dynamic form parts based on question type
  const [questionType, setQuestionType] = useState<string>('MultipleChoice');
  const [options, setOptions] = useState<Option[]>([
    { option_number: 'A', option_text: '', is_correct: false },
    { option_number: 'B', option_text: '', is_correct: false },
    { option_number: 'C', option_text: '', is_correct: false },
    { option_number: 'D', option_text: '', is_correct: false }
  ]);
  const [statements, setStatements] = useState<Statement[]>([
    { statement_label: 'A', statement_text: '', is_correct: false },
    { statement_label: 'B', statement_text: '', is_correct: false },
    { statement_label: 'C', statement_text: '', is_correct: false },
    { statement_label: 'D', statement_text: '', is_correct: false }
  ]);
  const [assertionReason, setAssertionReason] = useState<AssertionReason>({
    assertion_text: '',
    reason_text: '',
    correct_option: '',
  });
  const [matchingItems, setMatchingItems] = useState<MatchingItem[]>([
    { left_item_label: 'A', left_item_text: '', right_item_label: 'P', right_item_text: '' },
    { left_item_label: 'B', left_item_text: '', right_item_label: 'Q', right_item_text: '' },
    { left_item_label: 'C', left_item_text: '', right_item_label: 'R', right_item_text: '' },
    { left_item_label: 'D', left_item_text: '', right_item_label: 'S', right_item_text: '' }
  ]);
  const [matchingHeaders, setMatchingHeaders] = useState<MatchingHeaders>({
    left_column_header: 'Column A',
    right_column_header: 'Column B'
  });
  const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([
    { item_number: 1, item_label: '1', item_text: '' },
    { item_number: 2, item_label: '2', item_text: '' },
    { item_number: 3, item_label: '3', item_text: '' },
    { item_number: 4, item_label: '4', item_text: '' }
  ]);
  const [sequenceInfo, setSequenceInfo] = useState<SequenceInfo>({
    intro_text: '',
    correct_sequence: ''
  });
  
  // Initialize the form
  const form = useForm({
    resolver: zodResolver(questionFormSchema), 
    defaultValues: {
      subject_id: 1, // Biology
      topic_id: 0,
      subtopic_id: undefined,
      paper_id: undefined,
      question_number: 1,
      question_text: '',
      question_type: 'MultipleChoice' as const,
      source_type: 'Other' as const,
      explanation: '',
      difficulty_level: 'medium' as const,
      marks: 4,
      negative_marks: 1,
      is_image_based: false,
      image_url: '',
      is_active: true,
    },
  });
  
  // Fetch topics and subtopics on load
  useEffect(() => {
    const fetchTopicsAndSubtopics = async () => {
      try {
        // Fetch topics for Biology (subject_id = 1)
        const topicsResponse = await fetch('/api/admin/topics?subjectId=3');
        const topicsData = await topicsResponse.json();
        setTopics(topicsData);
        
        // Fetch all subtopics for Biology
        const subtopicsResponse = await fetch('/api/admin/subtopics?subjectId=3');
        const subtopicsData = await subtopicsResponse.json();
        setSubtopics(subtopicsData);
      } catch (error) {
        console.error('Error fetching topics and subtopics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load topics and subtopics',
          variant: 'destructive',
        });
      }
    };
    
    fetchTopicsAndSubtopics();
  }, [toast]);
  
  // Load question data if in edit mode
  useEffect(() => {
    if (isEdit && questionId) {
      const fetchQuestionData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/admin/questions/${questionId}`);
          if (!response.ok) throw new Error('Failed to fetch question');
          
          const questionData = await response.json();
          
          // Update form values
          form.reset({
            subject_id: questionData.subject_id,
            topic_id: questionData.topic_id,
            subtopic_id: questionData.subtopic_id || undefined,
            paper_id: questionData.paper_id || undefined,
            question_number: questionData.question_number,
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            source_type: questionData.source_type,
            explanation: questionData.explanation || '',
            difficulty_level: questionData.difficulty_level,
            marks: questionData.marks,
            negative_marks: questionData.negative_marks,
            is_image_based: questionData.is_image_based,
            image_url: questionData.image_url || '',
            is_active: questionData.is_active,
          });
          
          // Update question type
          setQuestionType(questionData.question_type);
          
          // Set dynamic form parts based on question type
          if (questionData.question_type === 'MultipleChoice' && questionData.details.options) {
            setOptions(questionData.details.options);
          }
          
          if (questionData.question_type === 'MultipleCorrectStatements' && questionData.details.statements) {
            setStatements(questionData.details.statements);
          }
          
          if (questionData.question_type === 'AssertionReason') {
            setAssertionReason({
              assertion_text: questionData.details.assertion_text || '',
              reason_text: questionData.details.reason_text || '',
              correct_option: questionData.details.correct_option || '',
            });
          }
          
          if (questionData.question_type === 'Matching' && questionData.details.items) {
            setMatchingItems(questionData.details.items);
            if (questionData.details.left_column_header || questionData.details.right_column_header) {
              setMatchingHeaders({
                left_column_header: questionData.details.left_column_header || 'Column A',
                right_column_header: questionData.details.right_column_header || 'Column B',
              });
            }
          }
          
          if (questionData.question_type === 'SequenceOrdering') {
            if (questionData.details.items) {
              setSequenceItems(questionData.details.items);
            }
            setSequenceInfo({
              intro_text: questionData.details.intro_text || '',
              correct_sequence: Array.isArray(questionData.details.correct_sequence) 
                ? questionData.details.correct_sequence.join(',')
                : questionData.details.correct_sequence || '',
            });
          }
        } catch (error) {
          console.error('Error loading question:', error);
          toast({
            title: 'Error',
            description: 'Failed to load question data',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchQuestionData();
    }
  }, [isEdit, questionId, form, toast]);
  
  // Filter subtopics when topic changes
  useEffect(() => {
    const topicId = form.watch('topic_id');
    if (topicId) {
      const filtered = subtopics.filter(
        (subtopic) => subtopic.topic_id === topicId
      );
      setFilteredSubtopics(filtered);
    } else {
      setFilteredSubtopics([]);
    }
  }, [form, subtopics]);
  
  // Handle form submission
  const onSubmit = async (values: QuestionFormValues) => {
    setIsLoading(true);
    
    // Add details based on question type
    let details = {};
    
    switch (values.question_type) {
      case 'MultipleChoice':
        details = { options };
        break;
      case 'MultipleCorrectStatements':
        details = { statements };
        break;
      case 'AssertionReason':
        details = assertionReason;
        break;
      case 'Matching':
        details = {
          ...matchingHeaders,
          items: matchingItems
        };
        break;
      case 'SequenceOrdering':
        details = {
          intro_text: sequenceInfo.intro_text,
          correct_sequence: sequenceInfo.correct_sequence.split(',').map(item => item.trim()),
          items: sequenceItems
        };
        break;
      case 'DiagramBased':
        // Just the basic structure, as diagram-based questions
        // rely more on the image and question text
        details = {};
        break;
    }
    
    // Create the complete data object
    const questionData = {
      ...values,
      details
    };
    
    try {
      let response;
      
      if (isEdit && questionId) {
        // Update existing question
        response = await fetch(`/api/admin/questions/${questionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData),
        });
      } else {
        // Create new question
        response = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData),
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save question');
      }
      
      await response.json(); // Consume the response body
      
      toast({
        title: isEdit ? 'Question Updated' : 'Question Created',
        description: `Question ${isEdit ? 'updated' : 'created'} successfully`,
      });
      
      // Redirect to question list
      router.push('/admin/biology/questions');
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: 'Failed to save question',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Watch for question type changes to update the form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'question_type' && value.question_type) {
        setQuestionType(value.question_type);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Render different form sections based on question type
  const renderQuestionTypeFields = () => {
    switch (questionType) {
      case 'MultipleChoice':
        return (
          <MultipleChoiceFields 
            options={options} 
            setOptions={setOptions} 
          />
        );
        
      case 'MultipleCorrectStatements':
        return (
          <MultipleCorrectStatementsFields 
            statements={statements} 
            setStatements={setStatements} 
          />
        );
        
      case 'AssertionReason':
        return (
          <AssertionReasonFields 
            assertionReason={assertionReason}
            setAssertionReason={setAssertionReason}
          />
        );
        
      case 'Matching':
        return (
          <MatchingFields 
            matchingItems={matchingItems}
            setMatchingItems={setMatchingItems}
            matchingHeaders={matchingHeaders}
            setMatchingHeaders={setMatchingHeaders}
          />
        );
        
      case 'SequenceOrdering':
        return (
          <SequenceOrderingFields 
            sequenceItems={sequenceItems}
            setSequenceItems={setSequenceItems}
            sequenceInfo={sequenceInfo}
            setSequenceInfo={setSequenceInfo}
          />
        );
        
      default:
        return null;        
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Question' : 'Create Question'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="subject_id"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Subject</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Biology</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="topic_id"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Topic</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic.topic_id} value={topic.topic_id.toString()}>
                              {topic.topic_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtopic_id"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Subtopic (Optional)</FormLabel>
                      <Select
                        value={field.value?.toString() || undefined}
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                        disabled={!form.watch('topic_id')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Subtopic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {filteredSubtopics.map((subtopic) => (
                            <SelectItem key={subtopic.subtopic_id} value={subtopic.subtopic_id.toString()}>
                              {subtopic.subtopic_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="question_number"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Question Number</FormLabel>
                      <Input type="number" {...field} min={1} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="question_text"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Question Text</FormLabel>
                      <Textarea 
                        placeholder="Enter the question text here" 
                        className="min-h-24" 
                        {...field} 
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="question_type"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Question Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Question Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MultipleChoice">Multiple Choice</SelectItem>
                          <SelectItem value="MultipleCorrectStatements">Multiple Correct Statements</SelectItem>
                          <SelectItem value="AssertionReason">Assertion Reason</SelectItem>
                          <SelectItem value="Matching">Matching</SelectItem>
                          <SelectItem value="SequenceOrdering">Sequence Ordering</SelectItem>
                          <SelectItem value="DiagramBased">Diagram Based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source_type"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Source Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Source Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PreviousYear">Previous Year</SelectItem>
                          <SelectItem value="AI_Generated">AI Generated</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {renderQuestionTypeFields()}

                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Explanation</FormLabel>
                      <Textarea 
                        placeholder="Enter explanation here (optional)" 
                        className="min-h-24" 
                        {...field} 
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="difficulty_level"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marks"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Marks</FormLabel>
                        <Input type="number" {...field} min={1} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="negative_marks"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Negative Marks</FormLabel>
                        <Input type="number" {...field} min={0} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_image_based"
                  render={({ field }) => (
                    <FormItem className="mb-4 flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Image Based Question</FormLabel>
                        <FormDescription>
                          Does this question include an image?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('is_image_based') && (
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Image URL</FormLabel>
                        <Input {...field} placeholder="Enter image URL" />
                        <FormDescription>
                          Enter a URL for the question image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="mb-4 flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Is this question active and available for use?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/biology/questions')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        {isEdit ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>{isEdit ? 'Update Question' : 'Create Question'}</>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}