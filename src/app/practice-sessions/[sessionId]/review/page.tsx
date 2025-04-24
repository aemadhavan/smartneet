'use client';

import { useParams } from 'next/navigation';

// Custom hook
import useSessionReview from './hooks/useSessionReview';

// Components
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import EmptyState from './components/EmptyState';
import SessionHeader from './components/SessionHeader';
import QuestionNavigation from './components/QuestionNavigation';
import QuestionDisplay from './components/QuestionDisplay';
import QuestionExplanation from './components/QuestionExplanation';
import NavigationControls from './components/NavigationControls';

export default function ReviewPage() {
  const { sessionId } = useParams();
  const parsedSessionId = parseInt(sessionId as string);
  
  const { 
    loading, 
    error, 
    attempts, 
    sessionSummary,
    currentIndex,
    goToNext,
    goToPrevious,
    goToQuestion
  } = useSessionReview(parsedSessionId);

  // Show loading state
  if (loading) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Show empty state
  if (!attempts.length) {
    return <EmptyState />;
  }

  const currentAttempt = attempts[currentIndex];

  return (
    <div className="container mx-auto py-8 px-4">
      <SessionHeader sessionId={parsedSessionId} sessionSummary={sessionSummary} />

      <div className="grid grid-cols-12 gap-6">
        {/* Question Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 order-2 lg:order-1">
          <QuestionNavigation 
            attempts={attempts} 
            currentIndex={currentIndex} 
            goToQuestion={goToQuestion}
          />
        </div>
        
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9 order-1 lg:order-2">
          <QuestionDisplay 
            currentAttempt={currentAttempt}
            currentIndex={currentIndex}
            totalQuestions={attempts.length}
          />
          
          <QuestionExplanation explanation={currentAttempt.explanation} />
          
          <NavigationControls 
            currentIndex={currentIndex}
            totalQuestions={attempts.length}
            goToPrevious={goToPrevious}
            goToNext={goToNext}
          />
        </div>
      </div>
    </div>
  );
}