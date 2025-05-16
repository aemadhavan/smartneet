// src/app/practice-sessions/[sessionId]/review/components/questions/index.tsx

import { QuestionAttempt } from '../interfaces';
import { 
  MultipleChoiceDetails, 
  MultipleChoiceAnswer,
  MatchingDetails,
  MatchingAnswer,
  AssertionReasonDetails,
  AssertionReasonAnswer,
  MultipleCorrectDetails,
  MultipleCorrectAnswer,
  SequenceOrderingDetails,
  SequenceOrderingAnswer,
  DiagramBasedDetails,
  DiagramBasedAnswer
} from '../interfaces';

// Import all question type components
import MultipleChoice from './MultipleChoice';
import Matching from './Matching';
import MultipleCorrect from './MultipleCorrect';
import AssertionReason from './AssertionReason';
import SequenceOrdering from './SequenceOrdering';
import DiagramBased from './DiagramBased';

interface QuestionContentProps {
  attempt: QuestionAttempt;
}

/**
 * Component that renders the appropriate question component based on question type
 */
export default function QuestionContent({ attempt }: QuestionContentProps) {
  switch (attempt.questionType) {
    case 'MultipleChoice':
      return (
        <MultipleChoice
          details={attempt.details as MultipleChoiceDetails}
          userAnswer={attempt.userAnswer as MultipleChoiceAnswer}
          correctAnswer={attempt.correctAnswer as MultipleChoiceAnswer}
          isImageBased={attempt.isImageBased === true}
          imageUrl={attempt.imageUrl || undefined}
          questionText={attempt.questionText}
        />
      );
      
    case 'Matching':
      return (
        <Matching
          details={attempt.details as MatchingDetails}
          userAnswer={attempt.userAnswer as MatchingAnswer}
          correctAnswer={attempt.correctAnswer as MatchingAnswer}
          isImageBased={attempt.isImageBased === true}
          imageUrl={attempt.imageUrl || undefined}
          questionText={attempt.questionText}
        />
      );

    case 'AssertionReason':
      return (
        <AssertionReason
          details={attempt.details as AssertionReasonDetails}
          userAnswer={attempt.userAnswer as AssertionReasonAnswer}
          correctAnswer={attempt.correctAnswer as AssertionReasonAnswer}
          isImageBased={attempt.isImageBased === true}
          imageUrl={attempt.imageUrl || undefined}
          questionText={attempt.questionText}
        />
      );
      
    case 'MultipleCorrectStatements':
      return (
        <MultipleCorrect
          details={attempt.details as MultipleCorrectDetails}
          userAnswer={attempt.userAnswer as MultipleCorrectAnswer}
          correctAnswer={attempt.correctAnswer as MultipleCorrectAnswer}
          isImageBased={attempt.isImageBased === true}
          imageUrl={attempt.imageUrl || undefined}
          questionText={attempt.questionText}
        />
      );
      
    case 'SequenceOrdering':
      return (
        <SequenceOrdering
          details={attempt.details as SequenceOrderingDetails}
          userAnswer={attempt.userAnswer as SequenceOrderingAnswer}
          correctAnswer={attempt.correctAnswer as SequenceOrderingAnswer}
          isImageBased={attempt.isImageBased === true}
          imageUrl={attempt.imageUrl || undefined}
          questionText={attempt.questionText}
        />
      );      
      
    case 'DiagramBased':
      return (
        <DiagramBased
          details={attempt.details as DiagramBasedDetails}
          userAnswer={attempt.userAnswer as DiagramBasedAnswer}
          correctAnswer={attempt.correctAnswer as DiagramBasedAnswer}
          isImageBased={attempt.isImageBased === true}
          imageUrl={attempt.imageUrl || undefined}
          questionText={attempt.questionText}
        />
      );
      
    default:
      return (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p>Question type &ldquo;{attempt.questionType}&rdquo; rendering not implemented</p>
        </div>
      );
  }
}