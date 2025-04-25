//File: /src/app/practice-sessions/[sessionId]/review/hooks/useSessionReview.ts
import { useState, useEffect } from 'react';
import { QuestionAttempt, SessionSummary } from '../components/interfaces';
import { normalizeQuestionAttempt } from '../components/helpers';

interface UseSessionReviewResult {
  loading: boolean;
  error: string | null;
  attempts: QuestionAttempt[];
  sessionSummary: SessionSummary | null;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  goToNext: () => void;
  goToPrevious: () => void;
  goToQuestion: (index: number) => void;
}

export default function useSessionReview(sessionId: number): UseSessionReviewResult {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    // Fetch session attempts from API
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        
        // Fetch review data
        const reviewResponse = await fetch(`/api/practice-sessions/${sessionId}/review`);
        
        if (!reviewResponse.ok) {
          const errorData = await reviewResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch session review data');
        }
        
        const reviewData = await reviewResponse.json();      
        console.log('Review Data:', reviewData); // Debugging line
        // Normalize the data format to handle API changes
        const normalizedAttempts = reviewData.attempts.map(normalizeQuestionAttempt);
        setAttempts(normalizedAttempts);
        
        // Fetch summary data
        const summaryResponse = await fetch(`/api/practice-sessions/${sessionId}/summary`);
        
        if (summaryResponse.ok) {
          // If summary is available, use it
          const summaryData = await summaryResponse.json();
          setSessionSummary(summaryData);
        } else {
          // Fallback to summary from review data if available
          setSessionSummary(reviewData.summary);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching review data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session review data');
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [sessionId]);

  const goToNext = () => {
    if (currentIndex < attempts.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
    window.scrollTo(0, 0);
  };

  return {
    loading,
    error,
    attempts,
    sessionSummary,
    currentIndex,
    setCurrentIndex,
    goToNext,
    goToPrevious,
    goToQuestion
  };
}