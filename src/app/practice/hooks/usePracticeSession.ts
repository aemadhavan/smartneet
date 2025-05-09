// File: src/app/practice/hooks/usePracticeSession.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Subject, SessionResponse } from '../types';

interface SubscriptionError {
  message: string;
  requiresUpgrade?: boolean;
  limitReached?: boolean;
}

interface PracticeSessionCache {
  session: SessionResponse;
  userAnswers: Record<number, string>;
  timestamp: number;
  currentIndex: number;
}

// Default number of questions per session
const DEFAULT_QUESTION_COUNT = 10;

// TTL for cached session data in milliseconds (5 minutes)
const SESSION_CACHE_TTL = 5 * 60 * 1000;

export function usePracticeSession(
  selectedSubject: Subject | null,
  onResetSubject?: (subject: Subject | null) => void, // Callback prop
  topicId?: number | null, // Parameter for topic ID
  subtopicId?: number | null, // Parameter for subtopic ID
  onSessionError?: (error: SubscriptionError) => void // New callback for subscription errors
) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Session caching reference
  const sessionCacheKey = useRef<string | null>(null);
  
  // Use ref to break dependency cycle
  const handleCompleteSessionRef = useRef<(() => Promise<void>) | null>(null);

  // Helper to get/set session data from/to localStorage cache
  // Wrap sessionCache in useMemo to prevent it from being recreated on each render
  const sessionCache = useMemo(() => ({
    getCache: (key: string): PracticeSessionCache | null => {
      try {
        const cachedData = localStorage.getItem(key);
        if (!cachedData) return null;
        
        const parsedData = JSON.parse(cachedData) as PracticeSessionCache;
        
        // Check if cache is still valid (within TTL)
        if (Date.now() - parsedData.timestamp > SESSION_CACHE_TTL) {
          localStorage.removeItem(key);
          return null;
        }
        
        return parsedData;
      } catch (e) {
        console.warn('Failed to read session cache:', e);
        return null;
      }
    },
    
    setCache: (key: string, data: PracticeSessionCache): void => {
      try {
        localStorage.setItem(key, JSON.stringify({
          ...data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to save session cache:', e);
      }
    },
    
    clearCache: (key: string): void => {
      localStorage.removeItem(key);
    }
  }), []); // Empty dependency array means this is created only once

  // Create a session function - made into a callback so it can be called manually
  const createSession = useCallback(async (subject: Subject) => {
    if (!subject) return;
    
    try {
      setLoading(true);
      setError(null);
      setSessionCompleted(false);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      
      // Generate a cache key based on subject/topic/subtopic
      sessionCacheKey.current = `practice_session:${subject.subject_id}:${topicId || 'all'}:${subtopicId || 'all'}`;
      
      // Check if we have a cached session
      const cachedSession = sessionCache.getCache(sessionCacheKey.current);
      
      if (cachedSession && !sessionCompleted) {
        // Restore session from cache
        setSession(cachedSession.session);
        setUserAnswers(cachedSession.userAnswers);
        setCurrentQuestionIndex(cachedSession.currentIndex);
        console.log('Restored session from cache');
        setLoading(false);
        return cachedSession.session;
      }
      
      // Build the session request payload
      const sessionPayload: {
        subject_id: number;
        topic_id?: number;
        subtopic_id?: number;
        session_type: string;
        question_count: number;
      } = {
        subject_id: subject.subject_id,
        session_type: 'Practice',
        question_count: DEFAULT_QUESTION_COUNT,
      };
      
      // Add topic_id if provided
      if (topicId) {
        sessionPayload.topic_id = topicId;
      }
      
      // Add subtopic_id if provided
      if (subtopicId) {
        sessionPayload.subtopic_id = subtopicId;
      }
      
      // Add an offline indicator to the URL to handle network issues
      const apiUrl = '/api/practice-sessions';
      const queryParams = new URLSearchParams();
      
      // Add parameters to query string
      Object.entries(sessionPayload).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if this is a subscription limit error
        if (response.status === 403 && (data.limitReached || data.upgradeRequired)) {
          const errorMessage = data.error || "You've reached your daily practice limit. Upgrade to Premium for unlimited practice tests.";
          
          // Call the subscription error callback if provided
          if (onSessionError) {
            onSessionError({
              message: errorMessage,
              requiresUpgrade: data.upgradeRequired,
              limitReached: data.limitReached
            });
          }
          
          throw new Error(errorMessage);
        }
        
        throw new Error(data.error || 'Failed to create practice session');
      }
      
      // Cache the new session
      if (sessionCacheKey.current) {
        sessionCache.setCache(sessionCacheKey.current, {
          session: data,
          userAnswers: {},
          timestamp: Date.now(),
          currentIndex: 0
        });
      }
      
      setSession(data);
      return data;
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load practice session. Please try again.');
      
      // If we have network issues, try to recover from cached session
      if (sessionCacheKey.current) {
        const cachedSession = sessionCache.getCache(sessionCacheKey.current);
        if (cachedSession) {
          console.log('Using cached session due to network error');
          setSession(cachedSession.session);
          setUserAnswers(cachedSession.userAnswers);
          setCurrentQuestionIndex(cachedSession.currentIndex);
          setError('Using cached session due to network issues. Your progress will be saved locally.');
          return cachedSession.session;
        }
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [topicId, subtopicId, onSessionError, sessionCache, sessionCompleted]);

  // Create a session when subject changes, but only if auto-creation is desired
  useEffect(() => {
    if (selectedSubject) {
      createSession(selectedSubject);
    }
  }, [selectedSubject, createSession]);

  // Reset selected option when changing questions
  useEffect(() => {
    // Only run this effect if we have a valid session and question
    if (session && session.questions[currentQuestionIndex]) {
      // We don't need to set or use questionId here
      // Just confirming we have a valid question at the current index
    }
  }, [currentQuestionIndex, userAnswers, session]);

  // Update cache when session state changes
  useEffect(() => {
    if (session && sessionCacheKey.current && !sessionCompleted) {
      sessionCache.setCache(sessionCacheKey.current, {
        session,
        userAnswers,
        timestamp: Date.now(),
        currentIndex: currentQuestionIndex
      });
    }
  }, [session, userAnswers, currentQuestionIndex, sessionCompleted, sessionCache]);

  // Handle option selection
  const handleOptionSelect = useCallback((questionId: number, optionNumber: string) => {
    if (!session) return;
    
    setUserAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: optionNumber,
      };
      
      // Update the cache with new answers
      if (sessionCacheKey.current && session) {
        sessionCache.setCache(sessionCacheKey.current, {
          session,
          userAnswers: updated,
          timestamp: Date.now(),
          currentIndex: currentQuestionIndex
        });
      }
      
      return updated;
    });
    
    // Debounced API call to save the answer - no need to wait for response
    // const saveAnswer = () => {
    //   if (!session) return;
      
    //   const currentQuestion = session.questions[currentQuestionIndex];
    //   if (!currentQuestion) return;
      
    //   // First, look up the correct session_question_id
    //   fetch(`/api/session-questions/lookup`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       session_id: session.sessionId,
    //       question_id: currentQuestion.question_id
    //     }),
    //   })
    //   .then(response => response.json())
    //   .then(data => {
    //     // Now submit the attempt with the correct session_question_id
    //     if (data.session_question_id) {
    //       fetch(`/api/question-attempts`, {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //           session_id: session.sessionId,
    //           session_question_id: data.session_question_id,
    //           question_id: currentQuestion.question_id,
    //           user_answer: {
    //             selectedOption: optionNumber
    //           },
    //           time_taken_seconds: 30
    //         }),
    //       }).catch(err => {
    //         console.warn('Failed to save answer, will retry later:', err);
    //       });
    //     } else {
    //       console.warn('Could not find session_question_id for question', currentQuestion.question_id);
    //     }
    //   })
    //   .catch(err => {
    //     console.warn('Failed to look up session_question_id:', err);
    //   });
    // };
    
    // Add a small delay to avoid too many API calls when user is selecting different options
    //setTimeout(saveAnswer, 500);
  }, [session, currentQuestionIndex, sessionCache]);

  // Handle completion of session
  const handleCompleteSession = useCallback(async () => {
    if (!session) return;
    try {
      const answeredCount = Object.keys(userAnswers).length;
      if (
        answeredCount < session.questions.length &&
        !confirm('You have not answered all questions. Are you sure you want to finish the session?')
      ) {
        return;
      }

      const answersPayload: Record<number, string> = {};
      session.questions.forEach((question) => {
        const questionId = question.question_id;
        if (userAnswers[questionId]) {
          answersPayload[questionId] = userAnswers[questionId];
        }
      });

      const response = await fetch(`/api/practice-sessions/${session.sessionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: answersPayload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit answers.');
      }

      const responseData = await response.json();
      console.log('Submission successful:', responseData);
      
      // Mark session as completed in state
      setSessionCompleted(true);
      
      // Clear the session cache since it's completed
      if (sessionCacheKey.current) {
        sessionCache.clearCache(sessionCacheKey.current);
      }
    } catch (err) {
      console.error('Error completing session:', err);
      alert('Failed to submit answers. Please try again.');
    }
  }, [session, userAnswers, sessionCache]);
  
  // Store the most recent version of handleCompleteSession in the ref
  useEffect(() => {
    handleCompleteSessionRef.current = handleCompleteSession;
  }, [handleCompleteSession]);

  // Handle navigation to next question
  const handleNextQuestion = useCallback(() => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        
        // Update the cache with new index
        if (sessionCacheKey.current && session) {
          sessionCache.setCache(sessionCacheKey.current, {
            session,
            userAnswers,
            timestamp: Date.now(),
            currentIndex: newIndex
          });
        }
        
        return newIndex;
      });
    } else {
      handleCompleteSession();
    }
  }, [currentQuestionIndex, session, userAnswers, handleCompleteSession, sessionCache]);

  // Handle start of a new session
  const handleStartNewSession = useCallback(() => {
    // Clear the session cache
    if (sessionCacheKey.current) {
      sessionCache.clearCache(sessionCacheKey.current);
      sessionCacheKey.current = null;
    }
    
    // Clear ALL session-related state including the session object itself
    setSession(null);
    setSessionCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    
    // Use the callback to reset the subject in the parent component
    if (selectedSubject && onResetSubject) {
      const tempSubject = { ...selectedSubject };
      onResetSubject(null);
      
      // Slightly longer timeout to ensure all state is properly cleared
      setTimeout(() => {
        // Create a new session directly instead of relying on the useEffect
        onResetSubject(tempSubject);
      }, 200);
    }
  }, [selectedSubject, onResetSubject, sessionCache]); 

  // Handle retry when there's an error
  const handleRetry = useCallback(() => {
    if (selectedSubject) {
      createSession(selectedSubject);
    }
  }, [selectedSubject, createSession]);

  return {
    session,
    loading,
    error,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    userAnswers,
    setUserAnswers,
    sessionCompleted,
    setSessionCompleted,
    handleOptionSelect,
    handleNextQuestion,
    handleCompleteSession,
    handleStartNewSession,
    handleRetry,
    createSession // Expose the createSession function so it can be called manually
  };
}