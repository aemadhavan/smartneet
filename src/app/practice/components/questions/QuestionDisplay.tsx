// File: src/app/practice/components/questions/QuestionDisplay.tsx
import { useState } from 'react';
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

interface QuestionDisplayProps {
  question: Question;
  selectedOption: string | null;
  onOptionSelect: (questionId: number, option: string) => void;
  onNextQuestion: () => void;
  onCompleteSession: () => void;
  isLastQuestion: boolean;
  onPreviousQuestion: () => void;
  currentQuestionIndex: number;
}

export function QuestionDisplay({
  question,
  selectedOption,
  onOptionSelect,
  onNextQuestion,
  onCompleteSession,
  isLastQuestion,
  onPreviousQuestion,
  currentQuestionIndex
}: QuestionDisplayProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Helper to handle potential JSON strings in the details property
  const parseDetails = (details: string | QuestionDetails): QuestionDetails => {
    if (typeof details === 'string') {
      try {
        return JSON.parse(details);
      } catch (e) {
        console.error('Error parsing question details:', e);
        return { error: 'Invalid JSON format', raw: details } as unknown as QuestionDetails;
      }
    }
    return details;
  };

  const details = parseDetails(question.details);

  // For debugging - log diagram-based questions
  if (question.question_type === 'DiagramBased') {
    console.log('Diagram question:', {
      id: question.question_id,
      is_image_based: question.is_image_based,
      image_url: question.image_url
    });
  }

  // Helper function to determine the image URL for diagram questions
  const getDiagramImageUrl = () => {
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
  };

  // Render different question types
  const renderQuestionContent = () => {
    if (!hasValidDetails()) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
          <p className="text-yellow-700 dark:text-yellow-200 mb-2 font-medium">Invalid question details format</p>
          <p className="text-yellow-600 dark:text-yellow-300 text-sm mb-4">
            This question cannot be displayed correctly. You can skip it or complete the session.
          </p>
          {isLastQuestion ? (
            <button 
              onClick={forceCompleteSession}
              className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-800 dark:hover:bg-amber-700 dark:text-amber-100 rounded"
            >
              Complete Session
            </button>
          ) : (
            <button 
              onClick={onNextQuestion}
              className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:hover:bg-indigo-700 dark:text-indigo-100 rounded"
            >
              Skip to Next Question
            </button>
          )}
        </div>
      );
    }

    switch (question.question_type) {
      case 'MultipleChoice':
        console.log('Multiple choice question:', question.question_id, details);
        return (
          <MultipleChoiceQuestion
            details={details as MultipleChoiceDetails}
            selectedOption={selectedOption}
            onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
          />
        );
      case 'Matching':
        return (
          <MatchingQuestion
            details={details as MatchingDetails}
            questionText={question.question_text}
            selectedOption={selectedOption}
            onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
          />
        );
      case 'AssertionReason':
        return (
          <AssertionReasonQuestion
            details={details as AssertionReasonDetails}
            questionText={question.question_text}
            selectedOption={selectedOption}
            onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
          />
        );
      case 'MultipleCorrectStatements':
        return (
          <MultipleCorrectStatementsQuestion
            details={details as MultipleCorrectStatementsDetails}
            selectedOption={selectedOption}
            onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
          />
        );
      case 'SequenceOrdering':
        return (
          <SequenceOrderingQuestion
            details={details as SequenceOrderingDetails}
            selectedOption={selectedOption}
            onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
          />
        );
      case 'DiagramBased':
        return (
          <DiagramBasedQuestion
            details={details as DiagramBasedDetails}
            imageUrl={getDiagramImageUrl()} // Use the helper function
            questionText={question.question_text}
            selectedOption={selectedOption}
            onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
          />
        );
      default:
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
            <p className="text-yellow-700 dark:text-yellow-200">Unsupported question type: {question.question_type}</p>
          </div>
        );
    }
  };
  const forceCompleteSession = () => {
    if (confirm('There appears to be an issue with some questions. Would you like to complete the session anyway?')) {
      onCompleteSession();
    }
  };
  const hasValidDetails = () => {
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
      console.error('Error validating question details:', e);
      return false;
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

      {/* Question text */}
      <div className="mb-6">
        <div 
          className="prose prose-indigo dark:prose-invert max-w-none text-gray-800 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: question.question_text }}
        />
      </div>

      {/* Question content based on type */}
      <div className="mb-6">
        {renderQuestionContent()}
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-wrap justify-between mt-8">
        <button
          onClick={onPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-md ${
            currentQuestionIndex === 0
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Previous
        </button>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
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
          >
            {!selectedOption && isLastQuestion ? 'Force Complete' : (isLastQuestion ? 'Complete' : 'Next')}
          </button>
      </div>

      {/* Explanation section */}
      {showExplanation && question.explanation && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-md border border-blue-100 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100 mb-2">Explanation</h3>
          <div 
            className="prose prose-sm prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: question.explanation }}
          />
        </div>
      )}
      {/* Add the debug component for development */}
        {process.env.NODE_ENV === 'development' && (
          <DebugQuestionInfo 
            question={question} 
            selectedOption={selectedOption}
          />
        )}
    </div>
  );
}
