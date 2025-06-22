// src/app/practice/hooks/usePracticeSession.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Subject, SessionResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useTimer, useQuestionTimer } from './useTimer';

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
  sessionStartTime?: number;
  questionTimes?: Record<number, number>;
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
  onSessionError?: (error: SubscriptionError) => void // Callback for subscription errors
) {
  // State management
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For tracking retry attempts internally without exposing to UI
  const retryCountRef = useRef<number>(0);
  
  // Session caching reference
  const sessionCacheKey = useRef<string | null>(null);
  
  // Use ref to break dependency cycle
  const handleCompleteSessionRef = useRef<(() => Promise<void>) | null>(null);

  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  // Add a ref to track if a session is being created
  const creatingSessionRef = useRef(false);
  const [creatingSession, setCreatingSession] = useState(false);

  // Timer hooks for tracking time
  const sessionTimer = useTimer();
  const questionTimer = useQuestionTimer();

  // Auto-start timer when session exists and is not completed
  useEffect(() => {
    if (session && !sessionCompleted && !sessionTimer.isRunning) {
      sessionTimer.start();
    }
  }, [session, sessionCompleted, sessionTimer]);

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
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Failed to clear session cache:', e);
      }
    }
  }), []); // Empty dependency array means this is created only once

  // Create a session function - made into a callback so it can be called manually
  const createSession = useCallback(async (subject: Subject) => {
    if (!subject) return null;
    if (creatingSessionRef.current) return null; // Prevent duplicate requests
    creatingSessionRef.current = true;
    setCreatingSession(true);
    try {
      const MAX_RETRIES = 3; // Allow more retries for cold starts
      const INITIAL_TIMEOUT = 15000; // 15 seconds for development cold starts
      let currentTimeout = INITIAL_TIMEOUT;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          setLoading(true);
          setError(null);
          
          // Generate a cache key based on subject/topic/subtopic
          const newCacheKey = `practice_session:${subject.subject_id}:${topicId || 'all'}:${subtopicId || 'all'}`;
          sessionCacheKey.current = newCacheKey;
          
          // Check if we have a cached session
          const cachedSession = sessionCache.getCache(newCacheKey);
          
          if (cachedSession && !sessionCompleted) {
            // Restore session from cache
            setSession(cachedSession.session);
            setUserAnswers(cachedSession.userAnswers);
            setCurrentQuestionIndex(cachedSession.currentIndex);
            
            // Restore timer state if available
            if (cachedSession.sessionStartTime) {
              // Continue timer from where it left off
              sessionTimer.reset();
              // Start timer and adjust elapsed time
              sessionTimer.start();
            } else {
              sessionTimer.reset();
              sessionTimer.start();
            }
            
            // Start question timer for current question if not already started
            const currentQuestion = cachedSession.session.questions[cachedSession.currentIndex];
            if (currentQuestion && !questionTimer.questionTimes[currentQuestion.question_id]) {
              questionTimer.startQuestionTimer(currentQuestion.question_id);
            }
            
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
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), currentTimeout);
          
          // Add timestamp to URL to avoid cache issues
          const apiUrl = '/api/practice-sessions';
          const queryParams = new URLSearchParams();
          
          // Add parameters to query string
          Object.entries(sessionPayload).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, value.toString());
            }
          });
          
          // Add timestamp for cache busting
          queryParams.append('t', Date.now().toString());
          
          // Add progressive delay for retries and cold start handling
          if (attempt === 0) {
            // First attempt: small delay for cold start
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            // Subsequent attempts: exponential backoff
            const backoffDelay = Math.min(2000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            currentTimeout = Math.min(currentTimeout * 1.5, 25000); // Increase timeout for retries
          }
          
          const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'Accept': 'application/json',
              ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {})
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch {
              // If we can't parse JSON, use status text
              errorData = { error: response.statusText };
            }
            
            // Check if this is a subscription limit error
            if (response.status === 403 && (errorData.limitReached || errorData.upgradeRequired)) {
              const errorMessage = errorData.error || "You've reached your daily practice limit. Upgrade to Premium for unlimited practice tests.";
              
              // Call the subscription error callback if provided
              if (onSessionError) {
                onSessionError({
                  message: errorMessage,
                  requiresUpgrade: errorData.upgradeRequired,
                  limitReached: errorData.limitReached
                });
              }
              
              throw new Error(errorMessage);
            }
            
            // Check if this is a rate limit error (429) - don't retry these
            if (response.status === 429) {
              const errorMessage = errorData.error || "Too many requests. Please wait a moment before trying again.";
              throw new Error(errorMessage);
            }
            
            // If it's a server error (5xx), retry with exponential backoff
            if (response.status >= 500) {
              throw new Error('Server error, will retry');
            }
            
            throw new Error(errorData.error || 'Failed to create practice session');
          }
          
          const data = await response.json();
          
          // Validate that the data has the expected structure
          if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error('Invalid session data: No questions returned');
          }
          
          // Cache the new session
          if (sessionCacheKey.current) {
            sessionCache.setCache(sessionCacheKey.current, {
              session: data,
              userAnswers: {},
              timestamp: Date.now(),
              currentIndex: 0,
              sessionStartTime: Date.now()
            });
          }
          
          // Reset state for new session
          setSession(data);
          setSessionCompleted(false);
          setUserAnswers({});
          setCurrentQuestionIndex(0);
          
          // Start session timer
          sessionTimer.reset();
          sessionTimer.start();
          
          // Start timer for first question
          if (data.questions && data.questions.length > 0) {
            questionTimer.startQuestionTimer(data.questions[0].question_id);
          }
          
          return data;
        } catch (err) {
          console.error(`Error creating session (attempt ${attempt + 1}/${MAX_RETRIES}):`, err);
          
          // Check if this is a rate limit or subscription error - don't retry these
          const isRateLimitError = err instanceof Error && 
            (err.message.includes('Too many requests') || err.message.includes('Rate limit') || err.message.includes('reached your daily limit'));
          
          if (isRateLimitError) {
            setError(err.message);
            return null;
          }
          
          // Specific handling for network errors
          const isNetworkError = err instanceof Error && 
            (err.name === 'AbortError' || err.message.includes('network') || err.message.includes('failed to fetch'));
          
          if (isNetworkError) {
            // If we have network issues, try to recover from cached session
            if (sessionCacheKey.current) {
              const cachedSession = sessionCache.getCache(sessionCacheKey.current);
              if (cachedSession) {
                console.log('Using cached session due to network error');
                setSession(cachedSession.session);
                setUserAnswers(cachedSession.userAnswers);
                setCurrentQuestionIndex(cachedSession.currentIndex);
                
                // Restore timer state
                if (cachedSession.sessionStartTime) {
                  sessionTimer.reset();
                  sessionTimer.start();
                }
                
                setError('Using cached session due to network issues. Your progress will be saved locally.');
                return cachedSession.session;
              }
            }
            
            // If this is the last attempt, show the error
            if (attempt === MAX_RETRIES - 1) {
              setError('Network error: Please check your connection and try again.');
              return null;
            }
            
            // Wait with exponential backoff before retrying
            // Reduced wait times to account for Vercel's limitations
            await new Promise(resolve => setTimeout(resolve, Math.min(500 * Math.pow(2, attempt), 3000)));
            currentTimeout = Math.min(currentTimeout * 1.2, 9000); // Cap timeout at 9s to stay under Vercel's limit
            continue;
          }
          
          // For non-network errors, show the error immediately
          setError(err instanceof Error ? err.message : 'Failed to load practice session. Please try again.');
          return null;
        } finally {
          setLoading(false);
        }
      }
      
      return null;
    } finally {
      creatingSessionRef.current = false;
      setCreatingSession(false);
    }
  }, [topicId, subtopicId, onSessionError, sessionCache, sessionCompleted, idempotencyKey, sessionTimer, questionTimer]);

  // Update cache when session state changes
  useEffect(() => {
    if (session && sessionCacheKey.current && !sessionCompleted) {
      sessionCache.setCache(sessionCacheKey.current, {
        session,
        userAnswers,
        timestamp: Date.now(),
        currentIndex: currentQuestionIndex,
        sessionStartTime: Date.now() - (sessionTimer.elapsedSeconds * 1000),
        questionTimes: questionTimer.questionTimes
      });
    }
  }, [session, userAnswers, currentQuestionIndex, sessionCompleted, sessionCache, sessionTimer.elapsedSeconds, questionTimer.questionTimes]);

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
          currentIndex: currentQuestionIndex,
          sessionStartTime: Date.now() - (sessionTimer.elapsedSeconds * 1000),
          questionTimes: questionTimer.questionTimes
        });
      }
      
      return updated;
    });
  }, [session, currentQuestionIndex, sessionCache, sessionTimer.elapsedSeconds, questionTimer.questionTimes]);

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

      // Stop current question timer if running
      const currentQuestion = session.questions[currentQuestionIndex];
      if (currentQuestion) {
        questionTimer.stopQuestionTimer(currentQuestion.question_id);
      }

      // Stop session timer
      const totalSessionTime = sessionTimer.stop();
  
      // Simplified answer payload format
      const answersPayload: Record<number, string> = {};
      session.questions.forEach((question) => {
        const questionId = question.question_id;
        if (userAnswers[questionId]) {
          answersPayload[questionId] = typeof userAnswers[questionId] === 'object' ? userAnswers[questionId] : String(userAnswers[questionId]);
        }
      });

      // Include timing data in the submission
      const submissionPayload = {
        answers: answersPayload,
        timingData: {
          totalSeconds: totalSessionTime,
          questionTimes: questionTimer.questionTimes,
          averageTimePerQuestion: questionTimer.getAverageTime()
        }
      };
      
      const response = await fetch(`/api/practice-sessions/${session.sessionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload),
      });
  
      const responseData = await response.json();
      
      // Check if response was successful (either standard success or already completed)
      if (response.ok || responseData.success) {
        console.log('Submission successful:', responseData);
        setSessionCompleted(true);
        if (sessionCacheKey.current) {
          sessionCache.clearCache(sessionCacheKey.current);
        }
        return;
      }
      
      // If we get here, there was an error
      throw new Error(responseData.error || 'Failed to submit answers.');
    } catch (err) {
      console.error('Error completing session:', err);
      
      // More user-friendly error messages
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answers';
      
      if (errorMessage.includes('already completed')) {
        // If it's already completed, just mark as completed locally
        setSessionCompleted(true);
        if (sessionCacheKey.current) {
          sessionCache.clearCache(sessionCacheKey.current);
        }
      } else {
        alert('Failed to submit answers. Please try again.');
      }
    }
  }, [session, userAnswers, sessionCache, currentQuestionIndex, questionTimer, sessionTimer]);

  // Store the most recent version of handleCompleteSession in the ref
  useEffect(() => {
    handleCompleteSessionRef.current = handleCompleteSession;
  }, [handleCompleteSession]);

  // Handle navigation to next question
  const handleNextQuestion = useCallback(() => {
    if (!session) return;
    
    // Stop timer for current question
    const currentQuestion = session.questions[currentQuestionIndex];
    if (currentQuestion) {
      questionTimer.stopQuestionTimer(currentQuestion.question_id);
    }
    
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        
        // Start timer for next question
        const nextQuestion = session.questions[newIndex];
        if (nextQuestion) {
          questionTimer.startQuestionTimer(nextQuestion.question_id);
        }
        
        // Update the cache with new index
        if (sessionCacheKey.current && session) {
          sessionCache.setCache(sessionCacheKey.current, {
            session,
            userAnswers,
            timestamp: Date.now(),
            currentIndex: newIndex,
            sessionStartTime: Date.now() - (sessionTimer.elapsedSeconds * 1000),
            questionTimes: questionTimer.questionTimes
          });
        }
        
        return newIndex;
      });
    } else {
      handleCompleteSession();
    }
  }, [currentQuestionIndex, session, userAnswers, handleCompleteSession, sessionCache, questionTimer, sessionTimer.elapsedSeconds]);

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
    setError(null);
    setIdempotencyKey(uuidv4());
    
    // Reset timers
    sessionTimer.reset();
    questionTimer.reset();
    
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
  }, [selectedSubject, onResetSubject, sessionCache, sessionTimer, questionTimer]); 

  // Handle retry when there's an error
  const handleRetry = useCallback(() => {
    setError(null);
    retryCountRef.current += 1;
    setIdempotencyKey(uuidv4());
    
    if (selectedSubject) {
      createSession(selectedSubject);
    }
  }, [selectedSubject, createSession]);

  // Force complete session (for abandoning)
  const forceCompleteSession = useCallback(async () => {
    if (!session) return;
    
    try {
      // Directly mark the session as completed in the database without evaluating answers
      const response = await fetch(`/api/practice-sessions/${session.sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          isCompleted: true
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete session.');
      }
      
      // Mark session as completed in state
      setSessionCompleted(true);
      
      // Clear the session cache
      if (sessionCacheKey.current) {
        sessionCache.clearCache(sessionCacheKey.current);
      }
      
      console.log('Session force-completed successfully');
    } catch (err) {
      console.error('Error force-completing session:', err);
      alert('Failed to complete session. Please try again.');
    }
  }, [session, sessionCache]);

  // Enhanced setCurrentQuestionIndex that handles timing
  const setCurrentQuestionIndexWithTiming = useCallback((newIndex: number | ((prevIndex: number) => number)) => {
    const currentQuestion = session?.questions[currentQuestionIndex];
    const actualNewIndex = typeof newIndex === 'function' ? newIndex(currentQuestionIndex) : newIndex;
    
    // Stop timer for current question
    if (currentQuestion && actualNewIndex !== currentQuestionIndex) {
      questionTimer.stopQuestionTimer(currentQuestion.question_id);
    }
    
    setCurrentQuestionIndex(actualNewIndex);
    
    // Start timer for new question
    const nextQuestion = session?.questions[actualNewIndex];
    if (nextQuestion && actualNewIndex !== currentQuestionIndex) {
      questionTimer.startQuestionTimer(nextQuestion.question_id);
    }
  }, [session, currentQuestionIndex, questionTimer]);

  return {
    session,
    loading,
    error,
    currentQuestionIndex,
    setCurrentQuestionIndex: setCurrentQuestionIndexWithTiming,
    userAnswers,
    setUserAnswers,
    sessionCompleted,
    setSessionCompleted,
    handleOptionSelect,
    handleNextQuestion,
    handleCompleteSession,
    handleStartNewSession,
    handleRetry,
    forceCompleteSession,
    createSession, // Expose the createSession function so it can be called manually
    creatingSession,
    // Timer states and functions
    sessionTimer: {
      isRunning: sessionTimer.isRunning,
      elapsedSeconds: sessionTimer.elapsedSeconds,
      formattedTime: sessionTimer.formattedTime,
      start: sessionTimer.start,
      pause: sessionTimer.pause,
      reset: sessionTimer.reset,
      stop: sessionTimer.stop
    },
    questionTimer: {
      questionTimes: questionTimer.questionTimes,
      getQuestionTime: questionTimer.getQuestionTime,
      getTotalTime: questionTimer.getTotalTime,
      getAverageTime: questionTimer.getAverageTime,
      reset: questionTimer.reset
    }
  };
}