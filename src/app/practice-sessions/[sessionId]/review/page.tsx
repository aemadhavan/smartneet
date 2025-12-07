import type { Metadata } from 'next';
import ReviewPageClient from './ReviewPageClient';

export const metadata: Metadata = {
  title: 'Review Practice Session | SmarterNEET',
  description:
    'Review your NEET practice session question-by-question, see correct answers, explanations, and track which topics need more attention.',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ReviewPage({ params }: any) {
  const parsedSessionId = parseInt(params.sessionId, 10);

  return <ReviewPageClient sessionId={parsedSessionId} />;
}
