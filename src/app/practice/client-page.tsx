// src/app/practice/client-page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import SessionCompletePage from './complete';
import { 
  SubjectSelector, 
  QuestionNavigator, 
  ErrorDisplay 
} from './components/ui';
import {
  LoadingSpinner,
  PremiumContentGate,
  DailyLimitReached,
  EmptyState,
  SessionContent
} from './components/session';

import { 
  useSubjects, 
  usePracticeSession 
} from './hooks';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Subject } from './types';

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

// Define SubscriptionError interface to match the one expected by usePracticeSession
interface SubscriptionError {
  message: string;
  requiresUpgrade?: boolean;
  limitReached?: boolean;
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
  
  // More detailed loading states
  const [isInitializing, setIsInitializing] = useState(true);
  const [, setRetryCount] = useState(0);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  
  // Performance monitoring using useRef to avoid dependency issues
  const performanceMetrics = useRef({
    pageLoadStart: Date.now(),
    subjectsLoadTime: 0,
    limitsCheckTime: 0,
    sessionCreateTime: 0
  });
  
  // Get subscription limit status 
  const { 
    limitStatus, 
    subscription, 
    loading: limitsLoading, 
    error: limitsError, 
    refetch: refetchLimits 
  } = useSubscriptionLimits();
  
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
  
  // Create a wrapper function for handling session errors
  const handleSessionError = useCallback((error: SubscriptionError) => {
    if (error.limitReached) {
      setLimitMessage(error.message);
      setShowLimitNotification(true);
    } else {
      console.error('Session error:', error);
    }
  }, []);
  
  const [isCompleting, setIsCompleting] = useState(false);
  
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
    handleCompleteSession: rawHandleCompleteSession,
    createSession,
    handleRetry: sessionRetry,
  } = usePracticeSession(
    // Don't automatically create session until we check limits
    null, 
    setSelectedSubject, 
    topicId, 
    subtopicId,
    handleSessionError
  );

  // Wrap handleCompleteSession to set loading state
  const handleCompleteSession = useCallback(async () => {
    setIsCompleting(true);
    try {
      await rawHandleCompleteSession();
    } finally {
      setIsCompleting(false);
    }
  }, [rawHandleCompleteSession]);

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

  // More robust session initialization with retries and better error handling
  useEffect(() => {
    let cancelled = false;
    const initSession = async () => {
      // Prevent automatic session creation after completion, when access is denied, or already initialized
      if (sessionInitialized || !selectedSubject || accessDenied || sessionCompleted) {
        setIsInitializing(false);
        return;
      }
      // Wait for limit status to be available (max 3 seconds)
      let waitTime = 0;
      const maxWaitTime = 3000; // 3 seconds
      const checkInterval = 100; // 100ms
      
      while (!limitStatus && waitTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
      }
      
      try {
        if (limitStatus && !limitStatus.canTake) {
          // Show limit notification if user can't take more tests
          setLimitMessage(limitStatus.reason || "You've reached your daily practice limit");
          setShowLimitNotification(true);
        } else {
          console.log('Creating new session for subject:', selectedSubject, 'at', new Date().toISOString());
          const sessionStartTime = Date.now();
          const newSession = await createSession(selectedSubject);
          const sessionEndTime = Date.now();
          
          // Log performance metrics
          console.log('Performance Metrics:', {
            sessionCreation: sessionEndTime - sessionStartTime,
            totalPageLoad: sessionEndTime - performanceMetrics.current.pageLoadStart,
            subjectsLoad: performanceMetrics.current.subjectsLoadTime,
            limitsCheck: performanceMetrics.current.limitsCheckTime
          });
          
          if (!cancelled && newSession) {
            setSessionInitialized(true);
            setLimitsRefreshKey(prev => prev + 1);
            refetchLimits();
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to initialize session:', error);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };
    
    initSession();
    return () => { cancelled = true; };
  }, [selectedSubject, limitStatus, accessDenied, createSession, refetchLimits, sessionInitialized, sessionCompleted]);

  // Combined loading state
  const loading = isInitializing || subjectsLoading || sessionLoading || limitsLoading || isCheckingAccess;
  
  // Combined error state with precedence
  const error = sessionError || subjectsError || limitsError;

  // Handle retry button click with improved recovery
  const handleRetry = useCallback(() => {
    setShowLimitNotification(false);
    setAccessDenied(false);
    // Don't reset sessionInitialized if session is completed
    if (!sessionCompleted) {
      setSessionInitialized(false);
    }
    setRetryCount(prev => prev + 1);
    setLimitsRefreshKey(prev => prev + 1);
    refetchLimits();
    sessionRetry();
    if (selectedSubject) {
      // Instead of resetting subject to null and back, just trigger session creation by incrementing retryCount
      // This avoids double session creation
    }
  }, [selectedSubject, refetchLimits, sessionRetry, sessionCompleted]);

  // Handle subject selection
  const handleSubjectSelect = useCallback((subject: Subject) => {
    // Clear any previous notifications
    setShowLimitNotification(false);
    setAccessDenied(false);
    // Don't reset sessionInitialized if session is completed
    if (!sessionCompleted) {
      setSessionInitialized(false);
    }
    setSelectedSubject(subject);
  }, [setSelectedSubject, sessionCompleted]);


  // Create session title based on filtering parameters
  const getSessionTitle = useCallback(() => {
    let title = `${selectedSubject?.subject_name} Practice`;
    
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
  }, [selectedSubject, topicId, subtopicId, session]);

  // If session is completed, show the completion page
  if (sessionCompleted && session) {
    return (
      <SessionCompletePage
        sessionId={session.sessionId}
      />
    );
  }

  // Render loading state with message based on what we're waiting for
  if (loading) {
    let loadingMessage = "Loading practice session...";
    
    if (isCheckingAccess) {
      loadingMessage = "Checking access...";
    } else if (limitsLoading) {
      loadingMessage = "Checking subscription limits...";
    } else if (subjectsLoading) {
      loadingMessage = "Loading subjects...";
    } else if (sessionLoading) {
      loadingMessage = "Preparing questions...";
    }
    
    return <LoadingSpinner message={loadingMessage} />;
  }

  // Render premium content access denied state
  if (accessDenied) {
    return <PremiumContentGate />;
  }

  // Render error state with more specific error messaging
  if (error) {
    return (
      <ErrorDisplay 
        message={error} 
        onRetry={handleRetry} 
        additionalInfo={
          error.includes("API not responding") ? 
          "We're experiencing connectivity issues. Please try again in a moment." : 
          undefined
        } 
      />
    );
  }

  // Render subject selection if no subject is selected
  if (!selectedSubject) {
    return <SubjectSelector subjects={subjects} onSelect={handleSubjectSelect} isPremium={isPremium} />;
  }
  
  // Render limit reached screen if user has hit their daily limit
  if (limitStatus && !limitStatus.canTake && !session) {
    return (
      <DailyLimitReached 
        reason={limitStatus.reason ?? undefined} 
        onRetry={handleRetry} 
      />
    );
  }

  // Render practice session
  if (session && session.questions && session.questions.length > 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        {!selectedSubject ? (
          <SubjectSelector
            subjects={subjects}
            loading={subjectsLoading}
            error={subjectsError}
            onSelect={setSelectedSubject}
          />
        ) : session ? (
          <div className="space-y-6">
            <QuestionNavigator
              questions={session.questions}
              currentIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              onQuestionSelect={setCurrentQuestionIndex}
            />
            <SessionContent
              session={session}
              title={getSessionTitle()}
              currentQuestionIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              isPremium={isPremium}
              limitParam={limitParam}
              limitStatus={limitStatus}
              limitsRefreshKey={limitsRefreshKey}
              showLimitNotification={showLimitNotification}
              limitMessage={limitMessage}
              setCurrentQuestionIndex={setCurrentQuestionIndex}
              handleOptionSelect={handleOptionSelect}
              handleNextQuestion={handleNextQuestion}
              handleCompleteSession={handleCompleteSession}
              isCompleting={isCompleting}
            />
          </div>
        ) : (
          <LoadingSpinner />
        )}
      </div>
    );
  }

  // Render empty state
  return (
    <EmptyState 
      onButtonClick={() => setSelectedSubject(null)} 
    />
  );
}