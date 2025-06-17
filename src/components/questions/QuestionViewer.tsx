// src/components/questions/QuestionViewer.tsx
import { useState, useEffect } from 'react';
import useQuestionById from '@/hooks/useQuestionById';
import { LaTeXRenderer } from '@/components/ui/LaTeXRenderer';
import {
  Question,
  QuestionDetails,
  MultipleChoiceDetails,
  MatchingDetails,
  AssertionReasonDetails,
  MultipleCorrectStatementsDetails,
  SequenceOrderingDetails,
  DiagramBasedDetails
} from '@/app/practice/types';
import { 
  MultipleChoiceQuestion, 
  MatchingQuestion, 
  AssertionReasonQuestion,
  MultipleCorrectStatementsQuestion,
  SequenceOrderingQuestion,
  DiagramBasedQuestion
} from '@/app/practice/components/questions';

interface QuestionViewerProps {
  questionId: number | string;
  onOptionSelect?: (questionId: number, option: string) => void;
  onNextQuestion?: () => void;
  onPreviousQuestion?: () => void;
  isLastQuestion?: boolean;
  showNavigation?: boolean;
  showFeedback?: boolean;
  onSubmit?: (questionId: number, selectedOption: string) => Promise<boolean>;
  selectedOption?: string | null;
}

export function QuestionViewer({
  questionId,
  onOptionSelect,
  onNextQuestion,
  onPreviousQuestion,
  isLastQuestion = false,
  showNavigation = true,
  showFeedback = false,
  onSubmit,
  selectedOption: externalSelectedOption
}: QuestionViewerProps) {
  const {
    question,
    loading,
    error,
    selectedOption: internalSelectedOption,
    showExplanation,
    handleOptionSelect,
    toggleExplanation
  } = useQuestionById(questionId);
  
  // Use external selectedOption if provided, otherwise use internal state
  const selectedOption = externalSelectedOption !== undefined ? externalSelectedOption : internalSelectedOption;

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Reset state when question changes
  useEffect(() => {
    setIsCorrect(null);
    setSubmitted(false);
  }, [questionId]);

  // Helper to parse question details
  const parseDetails = (details: string | QuestionDetails): QuestionDetails | { error: string; raw: string } => {
    if (typeof details === 'string') {
      try {
        return JSON.parse(details);
      } catch (e) {
        console.error('Error parsing question details:', e);
        return { error: 'Invalid JSON format', raw: details };
      }
    }
    return details;
  };

  // Helper function to determine the image URL for diagram questions
  const getDiagramImageUrl = (question: Question) => {
    if (question.is_image_based && question.image_url) {
      return question.image_url;
    }
    
    if (question.image_url) {
      return question.image_url;
    }
    
    return null;
  };

  // Handle option selection with optional callback
  const handleSelect = (option: string) => {
    handleOptionSelect(option);
    
    if (question && onOptionSelect) {
      onOptionSelect(question.question_id, option);
    }
  };

  // Handle submission with feedback
  const handleSubmit = async () => {
    if (!question || !selectedOption || !onSubmit) return;

    try {
      const result = await onSubmit(question.question_id, selectedOption);
      setIsCorrect(result);
      setSubmitted(true);
      
      // Automatically show explanation for incorrect answers
      if (!result) {
        toggleExplanation();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md border border-red-200 dark:border-red-700">
          <p className="text-red-700 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    );
  }

  // No question found
  if (!question) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
          <p className="text-yellow-700 dark:text-yellow-200">
            No question found with ID: {questionId}
          </p>
        </div>
      </div>
    );
  }

  // Parse the question details
  const details = parseDetails(question.details);

  // Render different question types
  const renderQuestionContent = () => {
    // Handle cases where details parsing failed
    if ('error' in details) {
      return (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md border border-red-200 dark:border-red-700">
          <p className="text-red-700 dark:text-red-200">
            Error loading question details: {details.error as string}. Raw data: {details.raw as string}
          </p>
        </div>
      );
    }

    // If we reach here, 'details' is narrowed to QuestionDetails
    switch (question.question_type) {
      case 'MultipleChoice':
        return (
          <MultipleChoiceQuestion
            details={details as MultipleChoiceDetails}
            selectedOption={selectedOption}
            onOptionSelect={handleSelect}
          />
        );
      case 'Matching':
        return (
          <MatchingQuestion
            details={details as MatchingDetails}
            questionText={question.question_text}
            selectedOption={selectedOption}
            onOptionSelect={handleSelect}
          />
        );
      case 'AssertionReason':
        return (
          <AssertionReasonQuestion
            details={details as AssertionReasonDetails}
            questionText={question.question_text}
            selectedOption={selectedOption}
            onOptionSelect={handleSelect}
          />
        );
      case 'MultipleCorrectStatements':
        return (
          <MultipleCorrectStatementsQuestion
            details={details as MultipleCorrectStatementsDetails}
            selectedOption={selectedOption}
            onOptionSelect={handleSelect}
          />
        );
      case 'SequenceOrdering':
        return (
          <SequenceOrderingQuestion
            details={details as SequenceOrderingDetails}
            selectedOption={selectedOption}
            onOptionSelect={handleSelect}
          />
        );
      case 'DiagramBased':
        return (
          <DiagramBasedQuestion
            details={details as DiagramBasedDetails}
            imageUrl={getDiagramImageUrl(question)}
            questionText={question.question_text}
            selectedOption={selectedOption}
            onOptionSelect={handleSelect}
          />
        );
      default:
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
            <p className="text-yellow-700 dark:text-yellow-200">
              Unsupported question type: {question.question_type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      {/* Question metadata */}
      <div className="flex flex-wrap justify-between items-start mb-4">
        <div className="flex items-center mb-2 md:mb-0">
          <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 px-2 py-1 rounded text-sm font-medium mr-2">
            {question.topic_name}
          </span>
          {question.subtopic_name && (
            <span className="bg-indigo-50 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-2 py-1 rounded text-sm">
              {question.subtopic_name}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm">
            {question.difficulty_level}
          </span>
          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-sm">
            {question.marks} marks
          </span>
        </div>
      </div>

      {/* Question ID badge */}
      <div className="mb-2">
        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">
          Question ID: {question.question_id}
        </span>
      </div>

      {/* Question text with LaTeX support */}
      <div className="mb-6">
        <LaTeXRenderer 
          content={question.question_text}
          className="prose prose-indigo dark:prose-invert max-w-none text-gray-800 dark:text-gray-100"
        />
      </div>

      {/* Question content based on type */}
      <div className="mb-6">
        {renderQuestionContent()}
      </div>

      {/* Feedback display (when submitted) */}
      {showFeedback && submitted && (
        <div className={`mt-4 p-3 rounded-md ${
          isCorrect 
            ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800'
        }`}>
          <p className={`font-medium ${
            isCorrect 
              ? 'text-green-800 dark:text-green-100' 
              : 'text-red-800 dark:text-red-100'
          }`}>
            {isCorrect 
              ? 'Correct! Well done.' 
              : 'Incorrect. Try reviewing the explanation.'}
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex flex-wrap justify-between mt-8">
        {showNavigation && (
          <>
            <button
              onClick={onPreviousQuestion}
              disabled={!onPreviousQuestion}
              className={`px-4 py-2 rounded-md ${
                !onPreviousQuestion
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Previous
            </button>
          </>
        )}

        <button
          onClick={toggleExplanation}
          className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800"
        >
          {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
        </button>

        {showFeedback && onSubmit && !submitted && (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`px-4 py-2 rounded-md ${
              !selectedOption
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600'
            }`}
          >
            Submit Answer
          </button>
        )}

        {showNavigation && (
          <button
            onClick={isLastQuestion ? undefined : onNextQuestion}
            disabled={!onNextQuestion || (!selectedOption && !submitted)}
            className={`px-4 py-2 rounded-md ${
              !onNextQuestion || (!selectedOption && !submitted)
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : isLastQuestion
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600'
            }`}
          >
            {isLastQuestion ? 'Complete' : 'Next'}
          </button>
        )}
      </div>

      {/* Explanation section with LaTeX support */}
      {showExplanation && question.explanation && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-md border border-blue-100 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100 mb-2">Explanation</h3>
          <LaTeXRenderer 
            content={question.explanation}
            className="prose prose-sm prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-200"
          />
        </div>
      )}
    </div>
  );
}