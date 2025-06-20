// File: src/app/practice/components/questions/QuestionDisplay.tsx
import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
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
import { DebugQuestionInfo } from '../debug/DebugQuestionInfo';
import { logger } from '@/lib/logger'; // Import the logger service
import QuestionErrorBoundary from './QuestionErrorBoundary';

interface QuestionDisplayProps {
  question: Question;
  selectedOption: string | null;
  onOptionSelect: (questionId: number, option: string) => void;
  onNextQuestion: () => void;
  onCompleteSession: () => void;
  isLastQuestion: boolean;
  onPreviousQuestion: () => void;
  currentQuestionIndex: number;
  isCompleting?: boolean;
}

const QuestionDisplay = memo(function QuestionDisplay({
  question,
  selectedOption,
  onOptionSelect,
  onNextQuestion,
  onCompleteSession,
  isLastQuestion,
  onPreviousQuestion,
  currentQuestionIndex,
  isCompleting
}: QuestionDisplayProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);

  // Move forceCompleteSession before renderQuestionContent
  const forceCompleteSession = useCallback(() => {
    // Using a more accessible dialog approach
    if (window.confirm('Some questions not answered. Would you like to continue and complete the session anyway?')) {
      onCompleteSession();
    }
  }, [onCompleteSession]);

  // Toggle explanation function
  const toggleExplanation = useCallback(() => {
    setShowExplanation(prev => !prev);
  }, []);

  // Focus the question when it changes
  useEffect(() => {
    if (questionRef.current) {
      questionRef.current.focus();
    }
  }, [question.question_id]);

  // Add keyboard navigation - memoized with useCallback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Navigation with arrow keys
    if (e.key === 'ArrowRight' && !isLastQuestion) {
      onNextQuestion();
    } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
      onPreviousQuestion();
    } else if (e.key === 'Enter' && isLastQuestion && selectedOption) {
      onCompleteSession();
    }
  }, [currentQuestionIndex, isLastQuestion, onNextQuestion, onPreviousQuestion, onCompleteSession, selectedOption]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Helper to handle potential JSON strings in the details property - memoized
  const details = useMemo(() => {
    const parseDetails = (details: string | QuestionDetails): QuestionDetails => {
      if (typeof details === 'string') {
        try {
          return JSON.parse(details);
        } catch (e) {
          logger.error('Error parsing question details', { 
            context: 'QuestionDisplay',
            data: {
              questionId: question.question_id
            },
            error: e instanceof Error ? e.message : String(e)
          });
          return { error: 'Invalid JSON format', raw: details } as unknown as QuestionDetails;
        }
      }
      return details;
    };
    
    return parseDetails(question.details);
  }, [question.details, question.question_id]);

  // Helper function to determine the image URL for diagram questions - memoized
  const diagramImageUrl = useMemo(() => {
    // If it's explicitly marked as image-based
    if (question.is_image_based && question.image_url) {
      return question.image_url;
    }
    
    // As a fallback, if image_url exists even if is_image_based isn't set
    if (question.image_url) {
      return question.image_url;
    }
    
    // No image URL available
    return null;
  }, [question.is_image_based, question.image_url]);

  const hasValidDetails = useCallback(() => {
    if (!details) return false;
    
    try {
      // Check if details has the expected structure for the question type
      switch (question.question_type) {
        case 'MultipleChoice':
          return Array.isArray((details as MultipleChoiceDetails).options);
        case 'Matching':
          return Array.isArray((details as MatchingDetails).options);
        case 'AssertionReason':
          return Array.isArray((details as AssertionReasonDetails).options);
        case 'MultipleCorrectStatements':
          return Array.isArray((details as MultipleCorrectStatementsDetails).options);
        case 'SequenceOrdering':
          return Array.isArray((details as SequenceOrderingDetails).options);
        case 'DiagramBased':
          return Array.isArray((details as DiagramBasedDetails).options);
        default:
          return false;
      }
    } catch (e) {
      logger.error('Error validating question details', { 
        context: 'QuestionDisplay',
        data: {
          questionId: question.question_id
        },
        error: e instanceof Error ? e.message : String(e)
      });
      return false;
    }
  }, [details, question.question_type, question.question_id]);

  // Render question content based on type
  const renderQuestionContent = useCallback(() => {
    if (!hasValidDetails()) {
      return (
        <div 
          className="bg-red-50 dark:bg-red-900 p-4 rounded-md border border-red-200 dark:border-red-700"
          role="alert"
        >
          <p className="text-red-700 dark:text-red-200">Invalid question format. Please try again or contact support.</p>
          <button
            onClick={forceCompleteSession}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            Force Complete Session
          </button>
        </div>
      );
    }

    switch (question.question_type) {
      case 'MultipleChoice':
        logger.debug('Rendering multiple choice question', { 
          context: 'QuestionDisplay',
          data: {
            questionId: question.question_id
          }
        });
        return (
          <QuestionErrorBoundary
            questionId={question.question_id}
            questionType={question.question_type}
            onSkipQuestion={!isLastQuestion ? onNextQuestion : undefined}
          >
            <MultipleChoiceQuestion
              details={details as MultipleChoiceDetails}
              selectedOption={selectedOption}
              onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
            />
          </QuestionErrorBoundary>
        );
      case 'Matching':
        return (
          <QuestionErrorBoundary
            questionId={question.question_id}
            questionType={question.question_type}
            onSkipQuestion={!isLastQuestion ? onNextQuestion : undefined}
          >
            <MatchingQuestion
              details={details as MatchingDetails}
              questionText={question.question_text}
              selectedOption={selectedOption}
              onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
            />
          </QuestionErrorBoundary>
        );
      case 'AssertionReason':
        return (
          <QuestionErrorBoundary
            questionId={question.question_id}
            questionType={question.question_type}
            onSkipQuestion={!isLastQuestion ? onNextQuestion : undefined}
          >
            <AssertionReasonQuestion
              details={details as AssertionReasonDetails}
              questionText={question.question_text}
              selectedOption={selectedOption}
              onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
            />
          </QuestionErrorBoundary>
        );
      case 'MultipleCorrectStatements':
        return (
          <QuestionErrorBoundary
            questionId={question.question_id}
            questionType={question.question_type}
            onSkipQuestion={!isLastQuestion ? onNextQuestion : undefined}
          >
            <MultipleCorrectStatementsQuestion
              details={details as MultipleCorrectStatementsDetails}
              selectedOption={selectedOption}
              onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
            />
          </QuestionErrorBoundary>
        );
      case 'SequenceOrdering':
        return (
          <QuestionErrorBoundary
            questionId={question.question_id}
            questionType={question.question_type}
            onSkipQuestion={!isLastQuestion ? onNextQuestion : undefined}
          >
            <SequenceOrderingQuestion
              details={details as SequenceOrderingDetails}
              selectedOption={selectedOption}
              onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
            />
          </QuestionErrorBoundary>
        );
      case 'DiagramBased':
        return (
          <QuestionErrorBoundary
            questionId={question.question_id}
            questionType={question.question_type}
            onSkipQuestion={!isLastQuestion ? onNextQuestion : undefined}
          >
            <DiagramBasedQuestion
              details={details as DiagramBasedDetails}
              imageUrl={diagramImageUrl} // Use the memoized value
              questionText={question.question_text}
              selectedOption={selectedOption}
              onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
            />
          </QuestionErrorBoundary>
        );
      default:
        return (
          <div 
            className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700"
            role="alert"
          >
            <p className="text-yellow-700 dark:text-yellow-200">Unsupported question type: {question.question_type}</p>
          </div>
        );
    }
  }, [hasValidDetails, question.question_id, question.question_type, question.question_text, details, selectedOption, isLastQuestion, onNextQuestion, onOptionSelect, diagramImageUrl, forceCompleteSession]);

  // Get the button label for the next/complete button - memoized
  const actionButtonLabel = useMemo(() => {
    if (!selectedOption && isLastQuestion) {
      return 'Force Complete';
    } else if (isLastQuestion) {
      return 'Complete';
    } else {
      return 'Next';
    }
  }, [selectedOption, isLastQuestion]);

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8"
      ref={questionRef}
      tabIndex={-1} // Allow focus but not in the tab order
      role="region"
      aria-label={`Question ${currentQuestionIndex + 1}`}
    >
      {/* Question metadata */}
      <div className="flex flex-wrap justify-between items-start mb-4">
        <div className="flex items-center mb-2 md:mb-0">
          <span 
            className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 px-2 py-1 rounded text-sm font-medium mr-2"
            aria-label={`Topic: ${question.topic_name}`}
          >
            {question.topic_name}
          </span>
          {question.subtopic_name && (
            <span 
              className="bg-indigo-50 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-2 py-1 rounded text-sm"
              aria-label={`Subtopic: ${question.subtopic_name}`}
            >
              {question.subtopic_name}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <span 
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm"
            aria-label={`Difficulty: ${question.difficulty_level}`}
          >
            {question.difficulty_level}
          </span>
          <span 
            className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-sm"
            aria-label={`Worth ${question.marks} marks`}
          >
            {question.marks} marks
          </span>
        </div>
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

      {/* Navigation buttons */}
      <div className="flex flex-wrap justify-between mt-8" role="navigation" aria-label="Question navigation">
        <button
          onClick={onPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-md ${
            currentQuestionIndex === 0
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          aria-label="Go to previous question"
          aria-disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>

        {/* Show/Hide Explanation Button */}
        <button
          onClick={toggleExplanation}
          className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800"
        >
          {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
        </button>

        <button
          onClick={isLastQuestion ? 
            (selectedOption ? onCompleteSession : forceCompleteSession) : 
            onNextQuestion}
          className={`px-4 py-2 rounded-md ${
            !selectedOption && isLastQuestion
              ? 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600'
              : isLastQuestion
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600'
          }`}
          aria-label={isLastQuestion ? 
            (selectedOption ? "Complete session" : "Force complete session") : 
            "Go to next question"}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <span className="flex items-center">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              Completing...
            </span>
          ) : (
            actionButtonLabel
          )}
        </button>
      </div>

      {/* Explanation section with LaTeX support */}
      {showExplanation && question.explanation && (
        <div 
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-md border border-blue-100 dark:border-blue-800"
          aria-live="polite"
        >
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100 mb-2" id="explanation-heading">
            Explanation
          </h3>
          <LaTeXRenderer 
            content={question.explanation}
            className="prose prose-sm prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-200"
          />
        </div>
      )}
      
      {/* Instructions for keyboard navigation */}
      <div className="sr-only" aria-live="polite">
        Use left and right arrow keys to navigate between questions. Press Enter to complete the session on the last question.
      </div>
      
      {/* Add the debug component for development */}
      {process.env.NODE_ENV === 'development' && (
        <DebugQuestionInfo 
          question={question} 
          selectedOption={selectedOption}
        />
      )}
    </div>
  );
});

export { QuestionDisplay };