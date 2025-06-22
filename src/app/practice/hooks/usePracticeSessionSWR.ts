// src/app/practice/hooks/usePracticeSessionSWR.ts
import { useState, useCallback, useRef, useMemo } from 'react';
import useSWRMutation from 'swr/mutation';
import { Subject, SessionResponse } from '../types';
import { logger } from '@/lib/logger';
import { createCacheKey, postFetcher } from '@/lib/swr-config';

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

// Helper to create session cache key
const createSessionCacheKey = (subjectId?: number, topicId?: number | null, subtopicId?: number | null): string => {
  return `practice_session:${subjectId || 'unknown'}:${topicId || 'all'}:${subtopicId || 'all'}`;
};

export function usePracticeSessionSWR(
  selectedSubject: Subject | null,
  onResetSubject?: (subject: Subject | null) => void, // Callback prop
  topicId?: number | null, // Parameter for topic ID
  subtopicId?: number | null, // Parameter for subtopic ID
  onSessionError?: (error: SubscriptionError) => void // Callback for subscription errors
) {
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  // Session caching reference
  const sessionCacheKey = useRef<string | null>(null);
  
  // Helper to get/set session data from/to localStorage cache
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
        logger.warn('Failed to read session cache', {
          error: e instanceof Error ? e.message : String(e),
          context: 'usePracticeSessionSWR'
        });
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
        logger.warn('Failed to save session cache', {
          error: e instanceof Error ? e.message : String(e),
          context: 'usePracticeSessionSWR'
        });
      }
    },
    
    clearCache: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        logger.warn('Failed to clear session cache', {
          error: e instanceof Error ? e.message : String(e),
          context: 'usePracticeSessionSWR'
        });
      }
    }
  }), []);

  // Generate API parameters for session
  const getSessionParams = useCallback(() => {
    if (!selectedSubject) return null;

    return {
      subject_id: selectedSubject.subject_id,
      topic_id: topicId,
      subtopic_id: subtopicId,
      session_type: 'Practice',
      question_count: DEFAULT_QUESTION_COUNT,
      t: Date.now() // Cache busting
    };
  }, [selectedSubject, topicId, subtopicId]);

  // Get cache key for session creation
  const cacheKey = useMemo(() => {
    const params = getSessionParams();
    if (!params) return null;
    return createCacheKey('/api/practice-sessions', params);
  }, [getSessionParams]);

  // Session creation mutation with SWR
  const { 
    trigger: createSessionTrigger, 
    data: session, 
    error: sessionError, 
    isMutating: isLoading 
  } = useSWRMutation<SessionResponse>(
    // Only enabled when we have a valid cache key
    cacheKey ? cacheKey : null,
    // Custom fetcher that handles our API format
    async () => {
      const params = getSessionParams();
      if (!params) throw new Error('Missing session parameters');

      // Create new URLSearchParams
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      try {
        // Check for cached session
        if (selectedSubject) {
          const newCacheKey = createSessionCacheKey(
            selectedSubject.subject_id, 
            topicId || undefined, 
            subtopicId || undefined
          );
          sessionCacheKey.current = newCacheKey;
          
          const cachedSession = sessionCache.getCache(newCacheKey);
          if (cachedSession && !sessionCompleted) {
            setUserAnswers(cachedSession.userAnswers);
            setCurrentQuestionIndex(cachedSession.currentIndex);
            logger.debug('Restored session from cache', {
              context: 'usePracticeSessionSWR',
              data: {
                sessionId: cachedSession.session.sessionId
              }
            });
            return cachedSession.session;
          }
        }

        // If no cache, fetch from server
        const response = await fetch(`/api/practice-sessions?${queryParams.toString()}`, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
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
            currentIndex: 0
          });
        }

        // Reset state for new session
        setSessionCompleted(false);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        
        return data;
      } catch (error) {
        logger.error('Error creating session', {
          error: error instanceof Error ? error.message : String(error),
          context: 'usePracticeSessionSWR'
        });
        throw error;
      }
    },
    {
      // Error handling for SWR Mutation
      onError: (err: Error | unknown) => {
        // Specific handling for network errors
        const isNetworkError = err instanceof Error && 
          (err.name === 'AbortError' || err.message.includes('network') || err.message.includes('failed to fetch'));
        // If we have network issues, try to recover from cached session
        if (isNetworkError && sessionCacheKey.current) {
          const cachedSession = sessionCache.getCache(sessionCacheKey.current);
          if (cachedSession) {
            logger.info('Using cached session due to network error', {
              context: 'usePracticeSessionSWR',
              data: {
                error: err instanceof Error ? err.message : String(err)
              }
            });
            setUserAnswers(cachedSession.userAnswers);
            setCurrentQuestionIndex(cachedSession.currentIndex);
          }
        }
      },
      // SWR Mutation specific configuration
      revalidate: false,
      populateCache: false,
      rollbackOnError: true
    }
  );

  // Handle session completion mutation
  const { trigger: submitAnswers } = useSWRMutation(
    session ? `/api/practice-sessions/${session.sessionId}/submit` : null,
    async (url) => {
      // Simplified answer payload format
      const answersPayload: Record<number, string> = {};
      session!.questions.forEach((question) => {
        const questionId = question.question_id;
        if (userAnswers[questionId]) {
          answersPayload[questionId] = typeof userAnswers[questionId] === 'object' ? 
            userAnswers[questionId] : String(userAnswers[questionId]);
        }
      });
      
      const response = await postFetcher(url, { answers: answersPayload });
      
      // Mark session as completed in state
      setSessionCompleted(true);
      
      // Clear the session cache since it's completed
      if (sessionCacheKey.current) {
        sessionCache.clearCache(sessionCacheKey.current);
      }
      
      return response;
    }
  );

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
  }, [session, currentQuestionIndex, sessionCache]);

  // Handle completion of session with enhanced error handling and retry
  const handleCompleteSession = useCallback(async (maxRetries: number = 3) => {
    if (!session) return;
    
    const attemptSubmission = async (attempt: number = 1): Promise<boolean> => {
      try {
        const answeredCount = Object.keys(userAnswers).length;
        
        // Confirm if not all questions are answered
        if (
          answeredCount < session.questions.length &&
          !confirm('You have not answered all questions. Are you sure you want to finish the session?')
        ) {
          return false;
        }

        // Submit answers using SWR mutation
        await submitAnswers();
        
        logger.info('Session completed successfully', { 
          context: 'usePracticeSessionSWR',
          data: {
            sessionId: session.sessionId
          }
        });
        
        return true;
      } catch (err) {
        logger.error(`Error completing session (attempt ${attempt}/${maxRetries})`, {
          error: err instanceof Error ? err.message : String(err),
          context: 'usePracticeSessionSWR'
        });
        
        // Check if this is a network error
        const isNetworkError = err instanceof Error && 
          (err.name === 'AbortError' || 
           err.name === 'TypeError' ||
           err.message.includes('Failed to fetch') ||
           err.message.includes('Network') ||
           err.message.includes('fetch') ||
           err.message.includes('FetchError'));
        
        if (isNetworkError && attempt < maxRetries) {
          // Show retry dialog for network errors
          const shouldRetry = confirm(
            `Network connection failed. This might be due to a poor internet connection.\n\nWould you like to retry? (Attempt ${attempt} of ${maxRetries})`
          );
          
          if (shouldRetry) {
            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
            return attemptSubmission(attempt + 1);
          }
        }
        
        // If it's not a network error or we've exhausted retries, show error
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit answers';
        
        if (isNetworkError) {
          // For network errors, offer to save locally
          const shouldSaveLocally = confirm(
            `Unable to submit your answers due to network issues. Your progress has been saved locally and will be submitted when you have a stable connection.\n\nWould you like to continue and mark this session as completed?`
          );
          
          if (shouldSaveLocally) {
            try {
              // Prepare submission data for local storage
              const answersPayload: Record<number, string> = {};
              session.questions.forEach((question) => {
                const questionId = question.question_id;
                if (userAnswers[questionId]) {
                  answersPayload[questionId] = typeof userAnswers[questionId] === 'object' ? 
                    userAnswers[questionId] : String(userAnswers[questionId]);
                }
              });
              
              const submissionData = {
                sessionId: session.sessionId,
                answers: answersPayload,
                timestamp: Date.now(),
                status: 'pending'
              };
              
              localStorage.setItem(`pending_submission_${session.sessionId}`, JSON.stringify(submissionData));
              
              // Mark as completed locally
              setSessionCompleted(true);
              if (sessionCacheKey.current) {
                sessionCache.clearCache(sessionCacheKey.current);
              }
              
              alert('Session completed locally. Your answers will be submitted automatically when you have a stable internet connection.');
              return true;
            } catch (storageError) {
              logger.error('Failed to save submission locally', {
                error: storageError instanceof Error ? storageError.message : String(storageError),
                context: 'usePracticeSessionSWR'
              });
              alert('Failed to save submission locally. Please try again when you have a stable internet connection.');
              return false;
            }
          }
        } else {
          alert(`Failed to submit answers: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
        }
        
        return false;
      }
    };
    
    return attemptSubmission();
  }, [session, userAnswers, submitAnswers, sessionCache, setSessionCompleted]);

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
    
    // Reset state
    setSessionCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    
    // Use the callback to reset the subject in the parent component
    if (selectedSubject && onResetSubject) {
      const tempSubject = { ...selectedSubject };
      onResetSubject(null);
      
      // Slightly longer timeout to ensure all state is properly cleared
      setTimeout(() => {
        onResetSubject(tempSubject);
      }, 200);
    }
  }, [selectedSubject, onResetSubject, sessionCache]);

  // Function to manually create a session
  const createSession = useCallback(async (subject: Subject) => {
    if (!subject) return null;
    
    try {
      // Call the SWR mutation trigger
      return await createSessionTrigger();
    } catch (error) {
      logger.error('Failed to create session', {
        error: error instanceof Error ? error.message : String(error),
        context: 'usePracticeSessionSWR'
      });
      return null;
    }
  }, [createSessionTrigger]);

  // Handle retry when there's an error
  const handleRetry = useCallback(() => {
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
      
      logger.info('Session force-completed successfully', {
        context: 'usePracticeSessionSWR',
        data: {
          sessionId: session.sessionId
        }
      });
    } catch (err) {
      logger.error('Error force-completing session', {
        error: err instanceof Error ? err.message : String(err),
        context: 'usePracticeSessionSWR'
      });
      alert('Failed to complete session. Please try again.');
    }
  }, [session, sessionCache]);

  // Properly format error message from SWR error
  const error = sessionError ? 
    (sessionError instanceof Error ? sessionError.message : String(sessionError)) : 
    null;

  return {
    session,
    loading: isLoading,
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
    forceCompleteSession,
    createSession // Expose the createSession function so it can be called manually
  };
}