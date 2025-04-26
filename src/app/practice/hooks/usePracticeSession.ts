// File: src/app/practice/hooks/usePracticeSession.ts
import { useState, useEffect, useCallback } from 'react';
import { Subject, SessionResponse } from '../types';

interface SubscriptionError {
  message: string;
  requiresUpgrade?: boolean;
  limitReached?: boolean;
}

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

  // Create a session function - made into a callback so it can be called manually
  const createSession = useCallback(async (subject: Subject) => {
    if (!subject) return;
    
    try {
      setLoading(true);
      setError(null);
      setSessionCompleted(false);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      
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
        question_count: 10, // Default number of questions
      };
      
      // Add topic_id if provided
      if (topicId) {
        sessionPayload.topic_id = topicId;
      }
      
      // Add subtopic_id if provided
      if (subtopicId) {
        sessionPayload.subtopic_id = subtopicId;
      }
      
      const response = await fetch('/api/practice-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionPayload),
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
      
      setSession(data);
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load practice session. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [topicId, subtopicId, onSessionError]);

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

  // Handle option selection
  const handleOptionSelect = useCallback((questionId: number, optionNumber: string) => {
    if (!session) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionNumber,
    }));
  }, [session]);

  // Handle navigation to next question
  const handleNextQuestion = useCallback(() => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      handleCompleteSession();
    }
  }, [currentQuestionIndex, session]);

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
      setSessionCompleted(true);
    } catch (err) {
      console.error('Error completing session:', err);
      alert('Failed to submit answers. Please try again.');
    }
  }, [session, userAnswers]);

  // Handle start of a new session
  const handleStartNewSession = useCallback(() => {
    setSessionCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    
    // Use the callback to reset the subject in the parent component
    if (selectedSubject && onResetSubject) {
      const tempSubject = { ...selectedSubject };
      onResetSubject(null);
      setTimeout(() => onResetSubject(tempSubject), 100);
    }
  }, [selectedSubject, onResetSubject]);

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
    createSession // Expose the createSession function so it can be called manually
  };
}