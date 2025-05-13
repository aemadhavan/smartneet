// src/app/practice/flashcards/page.tsx
'use client';

import { useState } from 'react';
import { QuestionViewer } from '@/components/questions/QuestionViewer';
import { useToast } from '@/hooks/useToast';

// Example array of question IDs for flashcard practice
// In a real implementation, these could be fetched from an API
// based on user's weak topics or spaced repetition algorithm
const EXAMPLE_QUESTION_IDS = [15, 23, 42, 56, 71, 89, 102, 118, 134, 152];

export default function FlashcardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState<'answer' | 'explanation'>('answer');
  const [results, setResults] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  // Current question ID
  const currentQuestionId = EXAMPLE_QUESTION_IDS[currentIndex];
  const isLastQuestion = currentIndex === EXAMPLE_QUESTION_IDS.length - 1;

  // Handle user marking their answer as correct/incorrect
  const handleMarkAnswer = async (isCorrect: boolean) => {
    // Store the result
    setResults(prev => ({
      ...prev,
      [currentQuestionId]: isCorrect
    }));
    
    // Show toast notification
    toast({
      title: isCorrect ? "Marked as Correct" : "Marked for Review",
      description: isCorrect 
        ? "Great! Keep up the good work." 
        : "You'll see this question again for practice.",
      variant: isCorrect ? "default" : "destructive",
    });
    
    // Switch to explanation mode
    setReviewMode('explanation');
  };

  // Handle moving to the next question
  const handleNext = () => {
    if (currentIndex < EXAMPLE_QUESTION_IDS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setReviewMode('answer');
    } else {
      // At the end, show a summary
      const correctCount = Object.values(results).filter(Boolean).length;
      
      toast({
        title: "Flashcard Session Complete",
        description: `You marked ${correctCount} out of ${EXAMPLE_QUESTION_IDS.length} cards as correct.`,
      });
    }
  };

  // Handle moving to the previous question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setReviewMode('answer');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Flashcard Practice</h1>
      
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Card {currentIndex + 1} of {EXAMPLE_QUESTION_IDS.length}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {Object.values(results).filter(Boolean).length} marked correct
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full"
            style={{ width: `${((currentIndex + 1) / EXAMPLE_QUESTION_IDS.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Question Viewer */}
      <QuestionViewer 
        questionId={currentQuestionId}
        showNavigation={false}
        showFeedback={false}
      />

      {/* Flashcard Controls */}
      <div className="mt-6 space-y-4">
        {reviewMode === 'answer' ? (
          <div className="flex flex-col space-y-3">
            <p className="text-center text-gray-700 dark:text-gray-300 mb-2">
              Did you know the answer?
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => handleMarkAnswer(false)}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                No, Need Review
              </button>
              <button 
                onClick={() => handleMarkAnswer(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Yes, Got It Right
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-md ${
                currentIndex === 0
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              className={`px-4 py-2 rounded-md ${
                isLastQuestion
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLastQuestion ? 'Finish' : 'Next'}
            </button>
          </div>
        )}
      </div>

      {/* Review summary cards */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Session Progress</h2>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTION_IDS.map((id, index) => (
            <button
              key={id}
              onClick={() => {
                setCurrentIndex(index);
                setReviewMode('answer');
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-md ${
                index === currentIndex
                  ? 'bg-indigo-600 text-white'
                  : results[id] === true
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100'
                    : results[id] === false
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}