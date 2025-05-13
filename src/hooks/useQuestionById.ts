// src/hooks/useQuestionById.ts
import { useState, useEffect, useCallback } from 'react';
import { Question } from '@/app/practice/types';

interface UseQuestionByIdResult {
  question: Question | null;
  loading: boolean;
  error: string | null;
  selectedOption: string | null;
  showExplanation: boolean;
  handleOptionSelect: (option: string) => void;
  toggleExplanation: () => void;
  refetch: () => Promise<void>;
}

const useQuestionById = (questionId: number | string | null): UseQuestionByIdResult => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const fetchQuestion = useCallback(async () => {
    if (!questionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/${questionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch question');
      }

      setQuestion(data);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  // Initial fetch
  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId, fetchQuestion]);

  // Reset selected option when question changes
  useEffect(() => {
    setSelectedOption(null);
    setShowExplanation(false);
  }, [questionId]);

  const handleOptionSelect = useCallback((option: string) => {
    setSelectedOption(option);
  }, []);

  const toggleExplanation = useCallback(() => {
    setShowExplanation(prev => !prev);
  }, []);

  const refetch = useCallback(async () => {
    await fetchQuestion();
  }, [fetchQuestion]);

  return {
    question,
    loading,
    error,
    selectedOption,
    showExplanation,
    handleOptionSelect,
    toggleExplanation,
    refetch
  };
};

export default useQuestionById;