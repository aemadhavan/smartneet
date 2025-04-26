// src/app/practice/client-page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import SessionCompletePage from './complete';
import { 
  SubjectSelector, 
  QuestionNavigator, 
  LoadingSpinner, 
  ErrorDisplay 
} from './components/ui';
import { 
  QuestionDisplay 
} from './components/questions';
import { 
  useSubjects, 
  usePracticeSession 
} from './hooks';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Subject } from './types';
import SubscriptionLimitDisplay from '@/components/subscription/SubscriptionLimitDisplay';
import SubscriptionLimitNotification from '@/components/subscription/SubscriptionLimitNotification';

export default function PracticeClientPage() {
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject')?.toLowerCase();
  const topicIdParam = searchParams.get('topicId');
  const subtopicIdParam = searchParams.get('subtopicId');
  
  // State for subscription limit notification
  const [showLimitNotification, setShowLimitNotification] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  
  // Parse topic and subtopic IDs if they exist
  const topicId = topicIdParam ? parseInt(topicIdParam) : null;
  const subtopicId = subtopicIdParam ? parseInt(subtopicIdParam) : null;
  
  // Get subscription limit status
  const { limitStatus, loading: limitsLoading, error: limitsError, refetch: refetchLimits } = useSubscriptionLimits();
  
  const [limitsRefreshKey, setLimitsRefreshKey] = useState(0);

  // Custom hooks for data fetching and state management
  const { 
    subjects, 
    loading: subjectsLoading, 
    error: subjectsError,
    selectedSubject,
    setSelectedSubject 
  } = useSubjects(subjectParam);
  
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    userAnswers,
    sessionCompleted,
    handleOptionSelect,
    handleNextQuestion,
    handleCompleteSession,
    handleStartNewSession,
    createSession
  } = usePracticeSession(
    // Don't automatically create session until we check limits
    null, 
    setSelectedSubject, 
    topicId, 
    subtopicId,
    // Handle subscription limit errors
    (error) => {
      if (error.limitReached) {
        setLimitMessage(error.message);
        setShowLimitNotification(true);
      }
    }
  );

  // Initialize session with selected subject after checking limits
  useEffect(() => {
    const initSession = async () => {
      if (selectedSubject && limitStatus && !sessionLoading && !session) {
        if (!limitStatus.canTake) {
          // Show limit notification if user can't take more tests
          setLimitMessage(limitStatus.reason || "You've reached your daily practice limit");
          setShowLimitNotification(true);
        } else {
          // Create session if user can take more tests
          await createSession(selectedSubject);
          // Increment the refresh key to force a re-fetch
          setLimitsRefreshKey(prev => prev + 1);
          // Refetch limits after creating session to update the counter
          refetchLimits();
        }
      }
    };
    
    initSession();
  }, [selectedSubject, limitStatus, sessionLoading, session, createSession, refetchLimits]);

  // Derived loading and error states
  const loading = subjectsLoading || sessionLoading || limitsLoading;
  const error = subjectsError || sessionError || limitsError;

  // Handle retry button click
  const handleRetry = () => {
    setShowLimitNotification(false);
    refetchLimits();
    
    if (selectedSubject) {
      const tempSubject = { ...selectedSubject };
      setSelectedSubject(null);
      setTimeout(() => setSelectedSubject(tempSubject), 100);
    }
  };

  // Handle subject selection
  const handleSubjectSelect = (subject: Subject) => {
    // Clear any previous notifications
    setShowLimitNotification(false);
    setSelectedSubject(subject);
  };

  // Add this function to your component
  const customHandleStartNewSession = () => {
    handleStartNewSession();
    // After a small delay to allow the session to be created
    setTimeout(() => {
      setLimitsRefreshKey(prev => prev + 1);
      refetchLimits();
    }, 300);
  };

  // If session is completed, show the completion page
  if (sessionCompleted && session) {
    return (
      <SessionCompletePage
        sessionId={session.sessionId}
        onStartNewSession={customHandleStartNewSession}
      />
    );
  }

  // Render loading state
  if (loading) {
    return <LoadingSpinner message="Loading practice session..." />;
  }

  // Render error state
  if (error) {
    return <ErrorDisplay message={error} onRetry={handleRetry} />;
  }

  // Render subject selection if no subject is selected
  if (!selectedSubject) {
    return <SubjectSelector subjects={subjects} onSelect={handleSubjectSelect} />;
  }
  
  // Render limit reached screen if user has hit their daily limit
  if (limitStatus && !limitStatus.canTake && !session) {
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-red-50 dark:bg-red-900/30 p-4 border-b border-red-100 dark:border-red-800">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400 mr-2" />
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
                Daily Test Limit Reached
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {limitStatus.reason || "You've reached your daily practice test limit. Upgrade to Premium for unlimited practice tests."}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link
                href="/pricing"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-center transition-colors"
              >
                Upgrade to Premium
              </Link>
              
              <button
                onClick={handleRetry}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-center transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create session title based on filtering parameters
  const getSessionTitle = () => {
    let title = `${selectedSubject.subject_name} Practice`;
    
    // Add topic information if filtering by topic
    if (topicId && session?.questions && session.questions.length > 0) {
      const firstQuestion = session.questions[0];
      if (firstQuestion.topic_name) {
        title = `${firstQuestion.topic_name} Practice`;
      }
    }
    
    // Add subtopic information if filtering by subtopic
    if (subtopicId && session?.questions && session.questions.length > 0) {
      const firstQuestion = session.questions[0];
      if (firstQuestion.subtopic_name) {
        title = `${firstQuestion.subtopic_name} Practice`;
      }
    }
    
    return title;
  };

  // Render practice session
  if (session && session.questions && session.questions.length > 0) {
    const currentQuestion = session.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === session.questions.length - 1;
    const selectedOption = userAnswers[currentQuestion.question_id] || null;
    
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{getSessionTitle()}</h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Subscription limit info component */}
            {limitStatus && <SubscriptionLimitDisplay refreshKey={limitsRefreshKey}/>}
            
            <div className="text-sm text-gray-500 dark:text-gray-300">
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%` }}
          />
        </div>

        <QuestionDisplay
          question={currentQuestion}
          selectedOption={selectedOption}
          onOptionSelect={handleOptionSelect}
          onNextQuestion={handleNextQuestion}
          onCompleteSession={handleCompleteSession}
          isLastQuestion={isLastQuestion}
          onPreviousQuestion={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          currentQuestionIndex={currentQuestionIndex}
        />

        {/* Question navigation */}
        <QuestionNavigator
          questions={session.questions}
          currentIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          onQuestionSelect={setCurrentQuestionIndex}
        />
        
        {/* Subscription limit notification - only shown when triggered */}
        {showLimitNotification && (
          <SubscriptionLimitNotification 
            message={limitMessage} 
            onDismiss={() => setShowLimitNotification(false)} 
          />
        )}
      </div>
    );
  }

  // Fallback if session is created but no questions
  return (
    <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">No Questions Available</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        {topicId 
          ? "No questions are available for this topic at the moment." 
          : subtopicId 
            ? "No questions are available for this subtopic at the moment."
            : "No questions are available for this subject at the moment."
        }
      </p>
      <Link
        href="/biology/bot"
        className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-200"
      >
        Back to Botany
      </Link>
    </div>
  );
}