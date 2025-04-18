// File: src/app/practice/hooks/useQuestionDetails.ts
import { useState, useEffect } from 'react';
import { Question, QuestionDetails } from '../types';

export function useQuestionDetails(question: Question) {
  const [details, setDetails] = useState<QuestionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!question || !question.details) {
      setDetails(null);
      return;
    }

    try {
      if (typeof question.details === 'string') {
        // Try to parse the details if it's a string
        const parsed = JSON.parse(question.details);
        // Handle double-encoded JSON (happens sometimes)
        const finalParsed = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
        setDetails(finalParsed);
      } else {
        // If it's already an object, use it directly
        setDetails(question.details as QuestionDetails);
      }
      setError(null);
    } catch (e) {
      console.error('Failed to parse question details:', e);
      setError('Failed to parse question details');
      setDetails(null);
    }
  }, [question]);

  return { details, error };
}