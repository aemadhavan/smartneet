import { QuestionAttempt } from '../interfaces';
import MultipleChoice from './MultipleChoice';
import Matching from './Matching';
import MultipleCorrect from './MultipleCorrect';
import AssertionReason from './AssertionReason';
import DiagramBased from './DiagramBased';
import SequenceOrdering from './SequenceOrdering';

interface QuestionContentProps {
  attempt: QuestionAttempt;
}

export default function QuestionContent({ attempt }: QuestionContentProps) {
  switch (attempt.questionType) {
    case 'MultipleChoice':
      return <MultipleChoice attempt={attempt} />;
    case 'Matching':
      return <Matching attempt={attempt} />;
    case 'MultipleCorrectStatements':
      return <MultipleCorrect attempt={attempt} />;
    case 'AssertionReason':
      return <AssertionReason attempt={attempt} />;
    case 'DiagramBased':
      return <DiagramBased attempt={attempt} />;
    case 'SequenceOrdering':
      return <SequenceOrdering attempt={attempt} />;
    default:
      return (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p>Question type &quot;{attempt.questionType}&quot; rendering not implemented</p>
        </div>
      );
  }
}