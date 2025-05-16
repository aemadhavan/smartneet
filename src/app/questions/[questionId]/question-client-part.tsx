'use client';

import { useState } from 'react';
import { QuestionViewer } from '@/components/questions/QuestionViewer';
import { useToast } from '@/hooks/useToast';

interface QuestionClientPartProps {
  questionId: string;
}

export default function QuestionClientPart({ questionId }: QuestionClientPartProps) {
  const { toast } = useToast();
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  // Function to validate an answer
  const submitAnswer = async (_questionId: number, _selectedOption: string): Promise<boolean> => {
    // We use questionId from props for the actual logic
    const numericQuestionId = Number(questionId); 
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isCorrect = numericQuestionId % 2 === 0;
      
      toast({
        title: isCorrect ? "Correct!" : "Incorrect",
        description: isCorrect 
          ? "Great job! Your answer is correct." 
          : "Sorry, that's not right. Review the explanation for more details.",
        variant: isCorrect ? "default" : "destructive",
      });
      
      setAnswerSubmitted(true);
      return isCorrect;
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
      // Don't return false as it doesn't prevent default behavior in React
      // Instead, we'll throw the error to be handled by the component using this function
      throw error;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Question Viewer</h1>
      
      <QuestionViewer 
        questionId={questionId} // Pass questionId prop
        showNavigation={false}
        showFeedback={true}
        onSubmit={answerSubmitted ? undefined : submitAnswer} // Pass updated submitAnswer
      />

      <div className="mt-6 flex justify-between">
        <a 
          href={`/questions/${Number(questionId) - 1}`} 
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Previous Question
        </a>
        <a 
          href={`/questions/${Number(questionId) + 1}`} 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          Next Question
        </a>
      </div>
    </div>
  );
}
