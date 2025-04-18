// File: src/app/practice/components/questions/QuestionDisplay.tsx
import { 
  Question, 
  QuestionDetails, 
  MultipleChoiceDetails, 
  MatchingDetails, 
  AssertionReasonDetails, 
  MultipleCorrectStatementsDetails, 
  SequenceOrderingDetails 
} from '@/app/practice/types';
import { useQuestionDetails } from '@/app/practice/hooks';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { MatchingQuestion } from './MatchingQuestion';
import { AssertionReasonQuestion } from './AssertionReasonQuestion';
import { MultipleCorrectStatementsQuestion } from './MultipleCorrectStatementsQuestion';
import { SequenceOrderingQuestion } from './SequenceOrderingQuestion';

interface QuestionDisplayProps {
  question: Question;
  selectedOption: string | null;
  onOptionSelect: (questionId: number, optionNumber: string) => void;
  onNextQuestion: () => void;
  onCompleteSession: () => void;
  onPreviousQuestion: () => void;
  isLastQuestion: boolean;
  currentQuestionIndex: number;
}

export function QuestionDisplay({
  question,
  selectedOption,
  onOptionSelect,
  onNextQuestion,
  onCompleteSession,
  onPreviousQuestion,
  isLastQuestion,
  currentQuestionIndex
}: QuestionDisplayProps) {
  const { details, error } = useQuestionDetails(question);

  // Type guard functions to check the shape of the details object
  const isMultipleChoiceDetails = (details: QuestionDetails): details is MultipleChoiceDetails => {
    return 'options' in details && !('items' in details) && !('statements' in details) && !('sequence_items' in details);
  };

  const isMatchingDetails = (details: QuestionDetails): details is MatchingDetails => {
    return 'items' in details && 'options' in details;
  };

  const isAssertionReasonDetails = (details: QuestionDetails): details is AssertionReasonDetails => {
    return 'statements' in details && 'options' in details && !('sequence_items' in details);
  };

  const isMultipleCorrectStatementsDetails = (details: QuestionDetails): details is MultipleCorrectStatementsDetails => {
    return 'statements' in details && 'options' in details && !('sequence_items' in details);
  };

  const isSequenceOrderingDetails = (details: QuestionDetails): details is SequenceOrderingDetails => {
    return 'sequence_items' in details && 'options' in details;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="mb-2 flex justify-between">
        <span className="text-sm font-medium text-gray-600">
          {question.topic_name}
          {question.subtopic_name && ` › ${question.subtopic_name}`}
        </span>
        <span
          className={`text-sm font-medium ${
            question.difficulty_level === 'easy'
              ? 'text-green-600'
              : question.difficulty_level === 'medium'
              ? 'text-yellow-600'
              : 'text-red-600'
          }`}
        >
          {question.difficulty_level.charAt(0).toUpperCase() +
            question.difficulty_level.slice(1)}
        </span>
      </div>
      <div className="text-lg text-gray-800 mb-6">
        <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
      </div>
      <div className="text-xs text-gray-500 mb-4">
        Question type: {question.question_type}
      </div>

      {/* Display different question types based on the question_type */}
      {error && (
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-6">
          <p className="text-yellow-700 font-medium">Question details format not recognized</p>
          <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">
            {JSON.stringify(question.details, null, 2)}
          </pre>
        </div>
      )}

      {!error && details && (() => {
        switch (question.question_type) {
          case 'MultipleChoice':
            if (isMultipleChoiceDetails(details)) {
              return (
                <MultipleChoiceQuestion
                  details={details}
                  selectedOption={selectedOption}
                  onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
                />
              );
            }
            break;
          case 'Matching':
            if (isMatchingDetails(details)) {
              return (
                <MatchingQuestion
                  details={details}
                  selectedOption={selectedOption}
                  onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
                />
              );
            }
            break;
          case 'AssertionReason':
            if (isAssertionReasonDetails(details)) {
              return (
                <AssertionReasonQuestion
                  details={details}
                  selectedOption={selectedOption}
                  onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
                />
              );
            }
            break;
          case 'MultipleCorrectStatements':
            if (isMultipleCorrectStatementsDetails(details)) {
              return (
                <MultipleCorrectStatementsQuestion
                  details={details}
                  selectedOption={selectedOption}
                  onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
                />
              );
            }
            break;
          case 'SequenceOrdering':
            if (isSequenceOrderingDetails(details)) {
              return (
                <SequenceOrderingQuestion
                  details={details}
                  selectedOption={selectedOption}
                  onOptionSelect={(option) => onOptionSelect(question.question_id, option)}
                />
              );
            }
            break;
        }
        
        // Fall through to here if the question type doesn't match or details don't match expected format
        return (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-yellow-700">
              {question.question_type === 'MultipleChoice' || 
               question.question_type === 'Matching' || 
               question.question_type === 'AssertionReason' || 
               question.question_type === 'MultipleCorrectStatements' || 
               question.question_type === 'SequenceOrdering' 
                ? `Invalid details format for ${question.question_type} question.`
                : `Question type '${question.question_type}' is not supported yet.`}
            </p>
          </div>
        );
      })()}

      {/* Navigation and submit buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded ${
            currentQuestionIndex === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Previous
        </button>
        <div className="flex space-x-4">
          {isLastQuestion ? (
            <button
              onClick={onCompleteSession}
              className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition duration-200"
            >
              Finish Session
            </button>
          ) : (
            <button
              onClick={onNextQuestion}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition duration-200"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}