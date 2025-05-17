// src/app/practice/client-page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
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

// Define Topic interface locally since it's not exported from './types'
interface Topic {
  topic_id: number;
  subject_id: number;
  topic_name: string;
  parent_topic_id?: number | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function PracticeClientPage() {
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject')?.toLowerCase();
  const topicIdParam = searchParams.get('topicId');
  const subtopicIdParam = searchParams.get('subtopicId');
  const limitParam = searchParams.get('limit');
  
  // State for subscription limit notification
  const [showLimitNotification, setShowLimitNotification] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  
  // Parse topic and subtopic IDs if they exist
  const topicId = topicIdParam ? parseInt(topicIdParam) : null;
  const subtopicId = subtopicIdParam ? parseInt(subtopicIdParam) : null;
  
  // Get subscription limit status
  const { limitStatus, subscription, loading: limitsLoading, error: limitsError, refetch: refetchLimits } = useSubscriptionLimits();
  
  // Check if user has premium access
  const isPremium = subscription?.planCode !== 'free';
  
  const [limitsRefreshKey, setLimitsRefreshKey] = useState(0);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);

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

  // Check if the topic is premium (not one of the first two topics)
  useEffect(() => {
    const checkTopicAccess = async () => {
      if (topicId && !isPremium && subjectParam === 'botany') {
        setIsCheckingAccess(true);
        try {
          // Get the subject ID for botany
          const botanySubjectId = 3; // Biology subject ID
          
          // Fetch all topics for this subject to determine if this is a free topic
          const topicsResponse = await fetch(`/api/topics?subjectId=${botanySubjectId}&isRootLevel=true&isActive=true`);
          
          if (!topicsResponse.ok) {
            throw new Error('Failed to check topic access');
          }
          
          const topicsData = await topicsResponse.json();
          
          if (!topicsData.success) {
            throw new Error(topicsData.error || 'Failed to check topic access');
          }
          
          // Find the index of the current topic
          const topicIndex = topicsData.data.findIndex((t: Topic) => t.topic_id === topicId);
          
          // If it's not one of the first two topics and the user is not premium, deny access
          if (topicIndex > 1 && !isPremium && limitParam !== 'free') {
            setAccessDenied(true);
          }
        } catch (error) {
          console.error('Error checking topic access:', error);
        } finally {
          setIsCheckingAccess(false);
        }
      }
    };
    
    checkTopicAccess();
  }, [topicId, isPremium, subjectParam, limitParam]);

  // Initialize session with selected subject after checking limits
  useEffect(() => {
    const initSession = async () => {
      if (selectedSubject && limitStatus && !sessionLoading && !session && !accessDenied) {
        if (!limitStatus.canTake) {
          // Show limit notification if user can't take more tests
          setLimitMessage(limitStatus.reason || "You&apos;ve reached your daily practice limit");
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
  }, [selectedSubject, limitStatus, sessionLoading, session, createSession, refetchLimits, accessDenied]);

  // Derived loading and error states
  const loading = subjectsLoading || sessionLoading || limitsLoading || isCheckingAccess;
  const error = subjectsError || sessionError || limitsError;

  // Handle retry button click
  const handleRetry = () => {
    setShowLimitNotification(false);
    setAccessDenied(false);
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
    setAccessDenied(false);
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

  // Render premium content access denied state
  if (accessDenied) {
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 border-b border-amber-100 dark:border-amber-800">
            <div className="flex items-center">
              <Lock className="h-6 w-6 text-amber-500 dark:text-amber-400 mr-2" />
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                Premium Content
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This topic is available only to premium users. Free users can access only the first two topics for practice.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link
                href="/pricing"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md text-center transition-colors"
              >
                Upgrade to Premium
              </Link>
              
              <Link
                href="/biology/bot"
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-center transition-colors"
              >
                Back to Topics
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
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
              {limitStatus.reason || "You&apos;ve reached your daily practice test limit. Upgrade to Premium for unlimited practice tests."}
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
          ></div>
        </div>

        {!isPremium && limitParam === 'free' && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-700">
              <span className="font-semibold">Free access:</span> You&apos;re using a free practice session. 
              <Link href="/pricing" className="ml-2 text-blue-600 underline">Upgrade to premium</Link> to access all topics.
            </p>
          </div>
        )}

        {/* Question display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
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
        </div>

        {/* Navigation */}
        <QuestionNavigator
          questions={session.questions}
          currentIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          onQuestionSelect={setCurrentQuestionIndex}
        />

        {/* Limit notification */}
        {showLimitNotification && 
          <SubscriptionLimitNotification 
            message={limitMessage}
          />
        }
      </div>
    );
  }

  // Render empty state
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">No questions available for this selection.</p>
      <button
        onClick={() => setSelectedSubject(null)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-md text-lg transition-colors"
      >
        Select Another Subject
      </button>
    </div>
  );
}