// src/app/practice/question-browser/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { QuestionViewer } from '@/components/questions/QuestionViewer';
import { useToast } from '@/hooks/useToast';

export default function QuestionBrowserPage() {
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const { toast } = useToast();

  // Fetch a list of question IDs on component mount
  useEffect(() => {
    const fetchQuestionIds = async () => {
      try {
        setLoading(true);
        // This would be a real API call in production to get a set of question IDs
        // For demo, we'll generate some random IDs
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate 10 random question IDs between 1-100
        const ids = Array.from({ length: 10 }, () => 
          Math.floor(Math.random() * 100) + 1
        );
        
        setQuestionIds(ids);
        setError(null);
      } catch (err) {
        console.error('Error fetching question IDs:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionIds();
  }, []);

  // Handle option selection
  const handleOptionSelect = (questionId: number, option: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  // Handle navigation to next question
  const handleNextQuestion = () => {
    if (currentIndex < questionIds.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Handle navigation to previous question
  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Handle completion of the quiz
  const handleComplete = () => {
    // Calculate results
    const totalAnswered = Object.keys(userAnswers).length;
    
    toast({
      title: "Quiz Completed",
      description: `You've answered ${totalAnswered} out of ${questionIds.length} questions.`,
    });
    
    // In a real implementation, you would submit all answers to your API
    console.log('User answers:', userAnswers);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md border border-red-200 dark:border-red-700">
          <p className="text-red-700 dark:text-red-200">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No questions found
  if (questionIds.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-700">
          <p className="text-yellow-700 dark:text-yellow-200">
            No questions available.
          </p>
        </div>
      </div>
    );
  }

  // Get current question ID
  const currentQuestionId = questionIds[currentIndex];
  const isLastQuestion = currentIndex === questionIds.length - 1;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Question Browser</h1>
      
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Question {currentIndex + 1} of {questionIds.length}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {Object.keys(userAnswers).length} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full"
            style={{ width: `${((currentIndex + 1) / questionIds.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Question display */}
      <QuestionViewer 
        questionId={currentQuestionId}
        onOptionSelect={handleOptionSelect}
        onNextQuestion={handleNextQuestion}
        onPreviousQuestion={handlePreviousQuestion}
        isLastQuestion={isLastQuestion}
        showNavigation={true}
        selectedOption={userAnswers[currentQuestionId] || null}
      />

      {/* Complete button (only visible on last question) */}
      {isLastQuestion && (
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleComplete}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Complete Quiz
          </button>
        </div>
      )}

      {/* Question navigation buttons */}
      <div className="mt-8 flex flex-wrap gap-2">
        {questionIds.map((id, index) => (
          <button
            key={id}
            onClick={() => setCurrentIndex(index)}
            className={`w-10 h-10 flex items-center justify-center rounded-md ${
              index === currentIndex
                ? 'bg-indigo-600 text-white'
                : userAnswers[id]
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}