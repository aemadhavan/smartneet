// src/app/questions/[questionId]/page.tsx
import QuestionClientPart from './question-client-part';

interface PageProps {
  params: Promise<{ questionId: string }>; // params is a Promise
}

export default async function QuestionPage({ params }: PageProps) {
  // Await the params to get the actual questionId
  const { questionId } = await params; 

  if (!questionId) {
    // Handle the case where questionId might be undefined after awaiting, though unlikely with route structure
    return <div>Error: Question ID not found.</div>;
  }

  return <QuestionClientPart questionId={questionId} />;
}
