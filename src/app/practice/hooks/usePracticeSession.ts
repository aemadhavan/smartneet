// File: src/app/practice/hooks/usePracticeSession.ts
import { useState, useEffect } from 'react';
import { Subject, SessionResponse } from '../types';

export function usePracticeSession(
  selectedSubject: Subject | null,
  onResetSubject?: (subject: Subject | null) => void // Add callback prop
) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new practice session when subject is selected
  useEffect(() => {
    const createSession = async () => {
      if (!selectedSubject) return;
      try {
        setLoading(true);
        setError(null);
        setSessionCompleted(false);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        
        const response = await fetch('/api/practice-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject_id: selectedSubject.subject_id,
            session_type: 'Practice',
            question_count: 10, // Default number of questions
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create practice session');
        }
        
        const sessionData = await response.json();
        setSession(sessionData);
        setLoading(false);
      } catch (err) {
        console.error('Error creating session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load practice session. Please try again.');
        setLoading(false);
      }
    };
    
    if (selectedSubject) {
      createSession();
    }
  }, [selectedSubject]);

  // Reset selected option when changing questions
  useEffect(() => {
    // Only run this effect if we have a valid session and question
    if (session && session.questions[currentQuestionIndex]) {
      // We don't need to set or use questionId here
      // Just confirming we have a valid question at the current index
    }
  }, [currentQuestionIndex, userAnswers, session]);

  // Handle option selection
  const handleOptionSelect = (questionId: number, optionNumber: string) => {
    if (!session) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionNumber,
    }));
  };

  // Handle navigation to next question
  const handleNextQuestion = () => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleCompleteSession();
    }
  };

  // Handle completion of session
  const handleCompleteSession = async () => {
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
  };

  // Handle start of a new session
  const handleStartNewSession = () => {
    setSessionCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    
    // Use the callback to reset the subject in the parent component
    if (selectedSubject && onResetSubject) {
      const tempSubject = { ...selectedSubject };
      onResetSubject(null);
      setTimeout(() => onResetSubject(tempSubject), 100);
    }
  };

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
    handleOptionSelect: (questionId: number, optionNumber: string) => handleOptionSelect(questionId, optionNumber),
    handleNextQuestion,
    handleCompleteSession,
    handleStartNewSession
  };
}