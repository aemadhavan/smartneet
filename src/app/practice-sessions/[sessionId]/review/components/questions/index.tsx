import { 
  FlexibleAnswerType,
  QuestionAttempt as BaseQuestionAttempt,
  MultipleChoiceAnswer,
  MatchingAnswer,
  MultipleCorrectAnswer,
  SequenceOrderingAnswer,
  DiagramBasedAnswer,
  QuestionType
} from '../interfaces';

// Option interfaces for each question type
type Option = { key: string; text: string };
type Item = { key: string; text: string };
type Statement = { key: string; text: string };
type SequenceItem = { key: string; text: string };

// Utility type to convert details to a compatible type
type DetailsWithOptions<T> = {
  [K in keyof T]: T[K];
} & {
  [key: string]: unknown; // More type-safe than 'any'
}

// Utility function to convert answer to FlexibleAnswerType
function convertToFlexibleAnswer(answer: Record<string, unknown> | null): FlexibleAnswerType {
  if (answer === null) return null;
  
  // Create a new object that spreads the original answer
  // This helps preserve the original structure while making it flexibly typed
  return { ...answer };
}
interface BaseQuestionAttemptWithAnswer extends BaseQuestionAttempt {
  userAnswer: FlexibleAnswerType;
  correctAnswer: FlexibleAnswerType;
}
// Specific typed question attempts
interface MultipleChoiceQuestionAttempt extends BaseQuestionAttempt {
  details: DetailsWithOptions<{ options?: Option[] }>;
  userAnswer: MultipleChoiceAnswer | null;
  correctAnswer: MultipleChoiceAnswer | null;
  isImageBased: boolean | null | undefined;
}

interface MatchingQuestionAttempt extends BaseQuestionAttempt {
  details: DetailsWithOptions<{ items?: Item[], options?: Option[] }>;
  userAnswer: MatchingAnswer | null;
  correctAnswer: MatchingAnswer | null;
  isImageBased: boolean | null | undefined;
}

interface MultipleCorrectQuestionAttempt extends BaseQuestionAttempt {
  details: DetailsWithOptions<{ statements?: Statement[] }>;
  userAnswer: MultipleCorrectAnswer | null;
  correctAnswer: MultipleCorrectAnswer | null;
  isImageBased: boolean | null | undefined;
}

interface DiagramBasedQuestionAttempt extends BaseQuestionAttempt {
  details: DetailsWithOptions<{ options?: Option[] }>;
  userAnswer: DiagramBasedAnswer | null;
  correctAnswer: DiagramBasedAnswer | null;
  isImageBased: boolean | null | undefined;
}

interface SequenceOrderingQuestionAttempt extends BaseQuestionAttempt {
  details: DetailsWithOptions<{ items?: SequenceItem[] }>;
  userAnswer: SequenceOrderingAnswer | null;
  correctAnswer: SequenceOrderingAnswer | null;
  isImageBased: boolean | null | undefined;
}

// Union type for all question attempts
type QuestionAttempt = 
  | MultipleChoiceQuestionAttempt 
  | MatchingQuestionAttempt 
  | MultipleCorrectQuestionAttempt 
  | DiagramBasedQuestionAttempt 
  | SequenceOrderingQuestionAttempt 
  | BaseQuestionAttempt;

import MultipleChoice from './MultipleChoice';
import Matching from './Matching';
import MultipleCorrect from './MultipleCorrect';
import AssertionReason from './AssertionReason';
import DiagramBased from './DiagramBased';
import SequenceOrdering from './SequenceOrdering';

// Define the component props
interface QuestionContentProps {
  attempt: QuestionAttempt;
}

// Helper function to convert specific question attempt to base type
function prepareQuestionAttempt<T extends BaseQuestionAttemptWithAnswer>(
  attempt: T
): T {
    // Explicitly preserve the original structure
    
    const processAnswer = (answer: FlexibleAnswerType): FlexibleAnswerType => {
      if (answer === null) return null;

      // If it's a string, try to parse it as JSON
      if (typeof answer === 'string') {
        try {
          return JSON.parse(answer);
        } catch (e) {
          // If parsing fails, return the original string
          return answer;
        }
      }

      // If it's an object, create a new object that maintains the original properties
      if (typeof answer === 'object' && answer !== null) {
        const newAnswer = { ...answer };
        return newAnswer;
      }

      return answer;
    };

  return {
    ...attempt,
    userAnswer: processAnswer(attempt.userAnswer),
    correctAnswer: processAnswer(attempt.correctAnswer),
  } as T;
}

export default function QuestionContent({ attempt }: { attempt: BaseQuestionAttemptWithAnswer }) {
 
  switch (attempt.questionType) {
    case 'MultipleChoice':
      return <MultipleChoice 
        attempt={prepareQuestionAttempt(attempt as MultipleChoiceQuestionAttempt)} 
      />;
    case 'Matching':
      return <Matching 
        attempt={prepareQuestionAttempt(attempt as MatchingQuestionAttempt)} 
      />;
    case 'MultipleCorrectStatements':
      return <MultipleCorrect 
        attempt={prepareQuestionAttempt(attempt as MultipleCorrectQuestionAttempt)} 
      />;
    case 'AssertionReason':
      // Create a compatible attempt object for AssertionReason
      const assertionAttempt = {
        ...attempt,
        userAnswer: typeof attempt.userAnswer === 'string' ? attempt.userAnswer : 
                    attempt.userAnswer && typeof attempt.userAnswer === 'object' ? 
                    { ...attempt.userAnswer } : null,
        correctAnswer: typeof attempt.correctAnswer === 'string' ? attempt.correctAnswer : 
                      attempt.correctAnswer && typeof attempt.correctAnswer === 'object' ? 
                      { ...attempt.correctAnswer } : null
      };
      return <AssertionReason attempt={assertionAttempt} />;
    case 'DiagramBased':
      return <DiagramBased 
        attempt={prepareQuestionAttempt(attempt as DiagramBasedQuestionAttempt)} 
      />;
    case 'SequenceOrdering':
      return <SequenceOrdering 
        attempt={prepareQuestionAttempt(attempt as SequenceOrderingQuestionAttempt)} 
      />;
    default:
      return (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p>Question type &quot;{attempt.questionType}&quot; rendering not implemented</p>
        </div>
      );
  }
}
