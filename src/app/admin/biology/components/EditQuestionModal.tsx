// src/app/admin/biology/components/EditQuestionModal.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge"; // Removed unused import
// import { Separator } from "@/components/ui/separator"; // Removed unused import
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Import your question types - make sure this path is correct for your project
interface Topic {
  topic_id: number;
  topic_name: string;
}

interface Subtopic {
  subtopic_id: number;
  topic_id: number;
  subtopic_name: string;
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

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  topics: Topic[];
  subtopics: Subtopic[];
  onSave: (updatedQuestion: Question) => Promise<void>;
}

export default function EditQuestionModal({
  isOpen,
  onClose,
  question,
  topics,
  subtopics,
  onSave
}: EditQuestionModalProps) {
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [filteredSubtopics, setFilteredSubtopics] = useState<Subtopic[]>([]);

  // Reset form when opened/closed or question changes
  useEffect(() => {
    if (question) {
      setEditedQuestion(JSON.parse(JSON.stringify(question))); // Deep clone
      setActiveTab('basic');
      
      // Filter subtopics based on selected topic
      const filtered = subtopics.filter(
        subtopic => subtopic.topic_id === question.topic_id
      );
      setFilteredSubtopics(filtered);
    } else {
      setEditedQuestion(null);
    }
  }, [question, subtopics, isOpen]);

  // Define a type for the possible values of basic fields
  type BasicFieldValue = Question[keyof Omit<Question, 'details'>]; 

  // Handle basic field changes
  const handleBasicChange = (field: keyof Question, value: BasicFieldValue) => {
    if (!editedQuestion) return;
    
    setEditedQuestion(prev => {
      if (!prev) return prev;
      
      // Handle topic change - reset subtopic_id if topic changes
      if (field === 'topic_id') {
        const newTopicId = Number(value);
        const filtered = subtopics.filter(subtopic => subtopic.topic_id === newTopicId);
        setFilteredSubtopics(filtered);
        
        return {
          ...prev,
          [field]: newTopicId,
          subtopic_id: null
        };
      }
      
      // Handle normal field updates
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Define a type for the possible values of detail fields
  type DetailFieldValue = QuestionDetails[keyof QuestionDetails];

  // Handle details field changes (Corrected Implementation)
  const handleDetailsChange = (field: keyof QuestionDetails, value: DetailFieldValue) => {
    if (!editedQuestion) return;
    
    setEditedQuestion(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        details: {
          ...prev.details,
          [field]: value // Directly update the field in the details object
        }
      };
    });
  };

  // Handle option changes for multiple choice questions (Corrected Implementation)
  const handleOptionChange = (index: number, field: keyof QuestionOption, value: string | number | boolean) => {
    if (!editedQuestion?.details?.options) return;
    
    setEditedQuestion(prev => {
      if (!prev || !prev.details.options) return prev; // Check options exist
      
      const newOptions = [...prev.details.options];
      // Ensure the option at the index exists before modifying
      if (newOptions[index]) {
        newOptions[index] = { 
          ...newOptions[index], 
          [field]: value 
        };
      } else {
        // Handle case where index might be out of bounds, though ideally UI prevents this
        console.warn(`Attempted to modify non-existent option at index ${index}`);
        return prev; // Return previous state if index is invalid
      }
      
      // If changing is_correct, ensure only one option is correct for multiple choice
      if (field === 'is_correct' && value === true && prev.question_type === 'MultipleChoice') {
        newOptions.forEach((option, i) => {
          if (i !== index) {
            option.is_correct = false;
          }
        });
      }
      
      return {
        ...prev,
        details: {
          ...prev.details,
          options: newOptions
        }
      };
    });
  };

  // Handle statement changes for multiple correct statements (Corrected Implementation)
  const handleStatementChange = (index: number, field: keyof QuestionStatement, value: string | boolean) => {
    if (!editedQuestion?.details?.statements) return;
    
    setEditedQuestion(prev => {
      if (!prev || !prev.details.statements) return prev; // Check statements exist
      
      const newStatements = [...prev.details.statements];
       // Ensure the statement at the index exists before modifying
      if (newStatements[index]) {
        newStatements[index] = { 
          ...newStatements[index], 
          [field]: value 
        };
      } else {
         console.warn(`Attempted to modify non-existent statement at index ${index}`);
         return prev; // Return previous state if index is invalid
      }
      
      return {
        ...prev,
        details: {
          ...prev.details,
          statements: newStatements
        }
      };
    });
  };

  // Add a new option (Corrected Implementation - was accidentally overwritten)
   const addOption = () => {
    if (!editedQuestion) return;
    
    setEditedQuestion(prev => {
      if (!prev) return prev;
      
      const options = prev.details.options || [];
      const newOptionNumber = options.length + 1;
      
      return {
        ...prev,
        details: {
          ...prev.details,
          options: [
            ...options,
            {
              option_number: newOptionNumber,
              option_text: '',
              is_correct: false
            }
          ]
        }
      };
    });
  };

  // Remove an option
  const removeOption = (index: number) => {
    if (!editedQuestion?.details?.options) return;
    
    setEditedQuestion(prev => {
      if (!prev || !prev.details.options) return prev;
      
      const newOptions = prev.details.options.filter((_, i) => i !== index);
      
      // Renumber remaining options
      newOptions.forEach((option, i) => {
        option.option_number = i + 1;
      });
      
      return {
        ...prev,
        details: {
          ...prev.details,
          options: newOptions
        }
      };
    });
  };

  // Add a new statement
  const addStatement = () => {
    if (!editedQuestion) return;
    
    setEditedQuestion(prev => {
      if (!prev) return prev;
      
      const statements = prev.details.statements || [];
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const newStatementLabel = alphabet[statements.length % alphabet.length];
      
      return {
        ...prev,
        details: {
          ...prev.details,
          statements: [
            ...statements,
            {
              statement_label: newStatementLabel,
              statement_text: '',
              is_correct: false
            }
          ]
        }
      };
    });
  };

  // Remove a statement
  const removeStatement = (index: number) => {
    if (!editedQuestion?.details?.statements) return;
    
    setEditedQuestion(prev => {
      if (!prev || !prev.details.statements) return prev;
      
      const newStatements = prev.details.statements.filter((_, i) => i !== index);
      
      // Relabel remaining statements
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      newStatements.forEach((statement, i) => {
        statement.statement_label = alphabet[i % alphabet.length];
      });
      
      return {
        ...prev,
        details: {
          ...prev.details,
          statements: newStatements
        }
      };
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!editedQuestion) return;
    
    setIsLoading(true);
    try {
      await onSave(editedQuestion);
      toast({
        title: "Question updated",
        description: "The question has been successfully updated.",
      });
      onClose();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to update the question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render based on question type
  const renderQuestionTypeFields = () => {
    if (!editedQuestion) return null;
    
    switch (editedQuestion.question_type) {
      case 'MultipleChoice':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Options</h3>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={addOption}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
            
            {editedQuestion.details.options?.map((option, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-start border p-4 rounded-md">
                <div className="col-span-1">
                  <Label htmlFor={`option-number-${index}`}>No.</Label>
                  <Input
                    id={`option-number-${index}`}
                    value={option.option_number.toString()}
                    onChange={(e) => handleOptionChange(index, 'option_number', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-9">
                  <Label htmlFor={`option-text-${index}`}>Text</Label>
                  <Textarea
                    id={`option-text-${index}`}
                    value={option.option_text}
                    onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id={`option-correct-${index}`}
                      checked={option.is_correct}
                      onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`option-correct-${index}`}>Correct</Label>
                  </div>
                </div>
                <div className="col-span-1 flex items-end">
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => removeOption(index)}
                    className="h-10"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'MultipleCorrectStatements':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Statements</h3>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={addStatement}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Statement
              </Button>
            </div>
            
            {editedQuestion.details.statements?.map((statement, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-start border p-4 rounded-md">
                <div className="col-span-1">
                  <Label htmlFor={`statement-label-${index}`}>Label</Label>
                  <Input
                    id={`statement-label-${index}`}
                    value={statement.statement_label}
                    onChange={(e) => handleStatementChange(index, 'statement_label', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-9">
                  <Label htmlFor={`statement-text-${index}`}>Text</Label>
                  <Textarea
                    id={`statement-text-${index}`}
                    value={statement.statement_text}
                    onChange={(e) => handleStatementChange(index, 'statement_text', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id={`statement-correct-${index}`}
                      checked={statement.is_correct}
                      onChange={(e) => handleStatementChange(index, 'is_correct', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`statement-correct-${index}`}>Correct</Label>
                  </div>
                </div>
                <div className="col-span-1 flex items-end">
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => removeStatement(index)}
                    className="h-10"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'AssertionReason':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="assertion-text">Assertion</Label>
              <Textarea
                id="assertion-text"
                value={editedQuestion.details.assertion_text || ''}
                onChange={(e) => handleDetailsChange('assertion_text', e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reason-text">Reason</Label>
              <Textarea
                id="reason-text"
                value={editedQuestion.details.reason_text || ''}
                onChange={(e) => handleDetailsChange('reason_text', e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        );
        
      // Add other question types here as needed
        
      default:
        return (
          <div className="p-4 border rounded-md bg-gray-50">
            <p>Editing for this question type is not fully implemented yet.</p>
            <p>Basic details can be edited in the Basic Info tab.</p>
          </div>
        );
    }
  };

  if (!editedQuestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question #{editedQuestion.question_number}</DialogTitle>
          <DialogDescription>
            Make changes to the question. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Question Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="question-number">Question Number</Label>
                <Input
                  id="question-number"
                  value={editedQuestion.question_number}
                  onChange={(e) => handleBasicChange('question_number', parseInt(e.target.value) || 0)}
                  type="number"
                />
              </div>
              
              <div>
                <Label htmlFor="question-type">Question Type</Label>
                <Select
                  value={editedQuestion.question_type}
                  onValueChange={(value) => handleBasicChange('question_type', value)}
                >
                  <SelectTrigger id="question-type">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MultipleChoice">Multiple Choice</SelectItem>
                    <SelectItem value="MultipleCorrectStatements">Multiple Correct Statements</SelectItem>
                    <SelectItem value="AssertionReason">Assertion Reason</SelectItem>
                    <SelectItem value="Matching">Matching</SelectItem>
                    <SelectItem value="DiagramBased">Diagram Based</SelectItem>
                    <SelectItem value="SequenceOrdering">Sequence Ordering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Select
                  value={editedQuestion.topic_id.toString()}
                  onValueChange={(value) => handleBasicChange('topic_id', parseInt(value))}
                >
                  <SelectTrigger id="topic">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.topic_id} value={topic.topic_id.toString()}>
                        {topic.topic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subtopic">Subtopic</Label>
                <Select
                  value={editedQuestion.subtopic_id?.toString() || undefined}
                  onValueChange={(value) => handleBasicChange('subtopic_id', parseInt(value))}
                  disabled={!editedQuestion.topic_id || filteredSubtopics.length === 0}
                >
                  <SelectTrigger id="subtopic">
                    <SelectValue placeholder={
                      !editedQuestion.topic_id ? "Select a topic first" : 
                      filteredSubtopics.length === 0 ? "No subtopics available" : 
                      "Select a subtopic"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubtopics.map((subtopic) => (
                      <SelectItem key={subtopic.subtopic_id} value={subtopic.subtopic_id.toString()}>
                        {subtopic.subtopic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={editedQuestion.difficulty_level}
                  onValueChange={(value) => handleBasicChange('difficulty_level', value as 'easy' | 'medium' | 'hard')}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="source-type">Source Type</Label>
                <Select
                  value={editedQuestion.source_type}
                  onValueChange={(value) => handleBasicChange('source_type', value as 'PreviousYear' | 'AI_Generated' | 'Other')}
                >
                  <SelectTrigger id="source-type">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PreviousYear">Previous Year</SelectItem>
                    <SelectItem value="AI_Generated">AI Generated</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="marks">Marks</Label>
                <Input
                  id="marks"
                  value={editedQuestion.marks}
                  onChange={(e) => handleBasicChange('marks', parseFloat(e.target.value) || 0)}
                  type="number"
                  step="0.5"
                />
              </div>
              
              <div>
                <Label htmlFor="negative-marks">Negative Marks</Label>
                <Input
                  id="negative-marks"
                  value={editedQuestion.negative_marks}
                  onChange={(e) => handleBasicChange('negative_marks', parseFloat(e.target.value) || 0)}
                  type="number"
                  step="0.5"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="question-text">Question Text</Label>
                <Textarea
                  id="question-text"
                  value={editedQuestion.question_text}
                  onChange={(e) => handleBasicChange('question_text', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="explanation">Explanation</Label>
                <Textarea
                  id="explanation"
                  value={editedQuestion.explanation || ''}
                  onChange={(e) => handleBasicChange('explanation', e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-image-based"
                  checked={editedQuestion.is_image_based}
                  onChange={(e) => handleBasicChange('is_image_based', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="is-image-based">Question includes an image</Label>
              </div>
              
              {editedQuestion.is_image_based && (
                <div className="col-span-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    value={editedQuestion.image_url || ''}
                    onChange={(e) => handleBasicChange('image_url', e.target.value)}
                    placeholder="Enter image URL"
                  />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4 py-4">
            {renderQuestionTypeFields()}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
