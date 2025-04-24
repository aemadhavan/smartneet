import { QuestionAttempt } from '../interfaces';
import MultipleChoice from './MultipleChoice';

interface DiagramBasedProps {
  attempt: QuestionAttempt;
}

export default function DiagramBased({ attempt }: DiagramBasedProps) {
  // DiagramBased questions are handled like multiple choice questions
  // but with added emphasis on the diagram
  return <MultipleChoice attempt={attempt} />;
}