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
    switch (question.question_type) {
      case 'MultipleChoice':
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
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-yellow-700">Unsupported question type: {question.question_type}</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {/* Question metadata */}
      <div className="flex flex-wrap justify-between items-start mb-4">
        <div className="flex items-center mb-2 md:mb-0">
          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium mr-2">
            {question.topic_name}
          </span>
          {question.subtopic_name && (
            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm">
              {question.subtopic_name}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
            {question.difficulty_level}
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
            {question.marks} marks
          </span>
        </div>
      </div>

      {/* Question text */}
      <div className="mb-6">
        <div 
          className="prose prose-indigo max-w-none"
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
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
        >
          {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
        </button>

        <button
          onClick={isLastQuestion ? onCompleteSession : onNextQuestion}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {isLastQuestion ? 'Complete' : 'Next'}
        </button>
      </div>

      {/* Explanation section */}
      {showExplanation && question.explanation && (
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Explanation</h3>
          <div 
            className="prose prose-sm prose-blue max-w-none"
            dangerouslySetInnerHTML={{ __html: question.explanation }}
          />
        </div>
      )}
    </div>
  );
}