//File: src/app/practice-sessions/[sessionId]/review/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  BarChart,
  BookOpen,
  Home
} from 'lucide-react';

interface QuestionAttempt {
  questionId: number;
  questionNumber: number;
  timeSpentSeconds: number;
  questionText: string;
  questionType: string;
  details: any;
  explanation: string;
  userAnswer: any;
  isCorrect: boolean;
  correctAnswer: any;
  marksAwarded: number;
  maxMarks: number;
  topic: {
    topicId: number;
    topicName: string;
  };
  subtopic?: {
    subtopicId: number;
    subtopicName: string;
  };
  isImageBased: boolean;
  imageUrl?: string;
}

interface SessionSummary {
  sessionId: number;
  totalQuestions: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  accuracy: number;
  timeTakenMinutes: number;
  score: number;
  maxScore: number;
  topicPerformance: {
    topicId: number;
    topicName: string;
    questionsCorrect: number;
    questionsTotal: number;
    accuracy: number;
  }[];
}

export default function ReviewPage({ params }: { params: { sessionId: string } }) {
  const sessionId = parseInt(params.sessionId);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  // Helper function to check if an attempt is correct
  const isCorrect = (attempt: QuestionAttempt): boolean => {
    return attempt.isCorrect;
  };

  // Helper function to extract the correct answer based on question type
  function getCorrectAnswer(details: any, questionType: string): any {
    try {
      switch (questionType) {
        case 'MultipleChoice':
          // Find the correct option
          const correctOption = details.options.find((opt: any) => opt.is_correct === true);
          // Return the option_number as the selected option
          return { selectedOption: correctOption ? correctOption.option_number || correctOption.key : null };
          
        case 'Matching':
          // Extract the correct matches
          const matches: Record<string, string> = {};
          details.items.forEach((item: any) => {
            matches[item.key] = item.matchesTo;
          });
          return { matches };
          
        case 'MultipleCorrectStatements':
          // Find all correct statements
          const correctStatements = details.statements
            .filter((statement: any) => statement.is_correct === true)
            .map((statement: any) => statement.key || statement.option_number);
          return { selectedStatements: correctStatements };
          
        case 'AssertionReason':
          // Return the correct selection
          return { selection: details.correctOption };
          
        case 'SequenceOrdering':
          // Return the correct sequence
          return { sequence: details.correctSequence };
          
        default:
          return null;
      }
    } catch (e) {
      console.error(`Error extracting correct answer for ${questionType}:`, e);
      return null;
    }
  }

  // This function standardizes the format of retrieved question attempts
  // It ensures that even if the server data format changes, the frontend can handle it
  const normalizeQuestionAttempt = (attempt: any): QuestionAttempt => {
    // Handle multiple choice questions correctly
    if (attempt.questionType === 'MultipleChoice') {
      // Ensure options have consistent properties for rendering
      const normalizedOptions = (attempt.details?.options || []).map((option: any) => ({
        key: option.option_number || option.key,
        text: option.option_text || option.text,
        isCorrect: option.is_correct || option.isCorrect || false
      }));
      
      if (attempt.details) {
        attempt.details.options = normalizedOptions;
      }
      
      // Ensure user answer format is consistent
      if (attempt.userAnswer) {
        // If the answer is in option_number format, convert to selectedOption
        attempt.userAnswer.selectedOption = attempt.userAnswer.selectedOption || 
                                          attempt.userAnswer.option_number;
      }
      
      // Ensure correct answer format is consistent
      if (attempt.correctAnswer) {
        // If the answer is in option_number format, convert to selectedOption
        attempt.correctAnswer.selectedOption = attempt.correctAnswer.selectedOption || 
                                              attempt.correctAnswer.option_number;
      }
    }
    
    // Similarly normalize other question types...
    // ... (code for other question types)
    
    return attempt as QuestionAttempt;
  };

  // Utility function to normalize option structures
  const normalizeOptions = (options: any[]) => {
    return options.map(option => ({
      key: option.option_number || option.key,
      text: option.option_text || option.text || 
            (typeof option === 'string' ? option : JSON.stringify(option)),
      isCorrect: option.is_correct || option.isCorrect || false
    }));
  };

  // Utility function to normalize statement structures
  const normalizeStatements = (statements: any[]) => {
    return statements.map(statement => ({
      key: statement.option_number || statement.key,
      text: statement.statement_text || statement.option_text || statement.text,
      isCorrect: statement.is_correct || statement.isCorrect || false
    }));
  };

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

  // Render the question based on its type
  const renderQuestionContent = (attempt: QuestionAttempt) => {
    switch (attempt.questionType) {
      case 'MultipleChoice':
        return renderMultipleChoiceQuestion(attempt);
      case 'Matching':
        return renderMatchingQuestion(attempt);
      case 'MultipleCorrectStatements':
        return renderMultipleCorrectStatementsQuestion(attempt);
      case 'AssertionReason':
        return renderAssertionReasonQuestion(attempt);
      case 'DiagramBased':
        return renderDiagramBasedQuestion(attempt);
      case 'SequenceOrdering':
        return renderSequenceOrderingQuestion(attempt);
      default:
        return (
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
            <p>Question type &quot;{attempt.questionType}&quot; rendering not implemented</p>
          </div>
        );
    }
  };

  const renderMultipleChoiceQuestion = (attempt: QuestionAttempt) => {
    const rawOptions = attempt.details.options || [];
    const options = normalizeOptions(rawOptions);
    const userSelection = attempt.userAnswer?.selectedOption;
    const correctOption = attempt.correctAnswer?.selectedOption;
    
    return (
      <div className="space-y-4">
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {attempt.questionText}
        </div>
        
        {attempt.isImageBased && attempt.imageUrl && (
          <div className="my-4">
            <img 
              src={attempt.imageUrl} 
              alt="Question diagram" 
              className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            />
          </div>
        )}
        
        <div className="space-y-2 mt-4">
          {options.map((option, idx) => {
            // Determine the status of this option
            const isUserSelection = userSelection === option.key;
            const isCorrectOption = correctOption === option.key;
            const isCorrectSelection = isUserSelection && isCorrectOption;
            const isIncorrectSelection = isUserSelection && !isCorrectOption;
            
            // Determine styling based on status
            let bgColorClass = 'bg-gray-50 dark:bg-gray-800';
            let borderColorClass = 'border-gray-200 dark:border-gray-700';
            let textColorClass = 'text-gray-700 dark:text-gray-300';
            
            if (isCorrectSelection) {
              bgColorClass = 'bg-green-50 dark:bg-green-900/20';
              borderColorClass = 'border-green-300 dark:border-green-700';
              textColorClass = 'text-green-800 dark:text-green-300';
            } else if (isIncorrectSelection) {
              bgColorClass = 'bg-red-50 dark:bg-red-900/20';
              borderColorClass = 'border-red-300 dark:border-red-700';
              textColorClass = 'text-red-800 dark:text-red-300';
            } else if (isCorrectOption) {
              bgColorClass = 'bg-green-50 dark:bg-green-900/20';
              borderColorClass = 'border-green-300 dark:border-green-700';
              textColorClass = 'text-green-800 dark:text-green-300';
            }
            
            return (
              <div 
                key={idx}
                className={`p-3 rounded-md border-2 ${bgColorClass} ${borderColorClass}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCorrectSelection
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        : isIncorrectSelection
                        ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                        : isCorrectOption
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.key}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`${textColorClass} font-medium`}>
                      {option.text}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                    {isUserSelection && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        Your answer
                      </span>
                    )}
                    {isCorrectOption && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Correct answer
                      </span>
                    )}
                    {isCorrectSelection && (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                    )}
                    {isIncorrectSelection && (
                      <XCircle className="text-red-600 dark:text-red-400" size={20} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMatchingQuestion = (attempt: QuestionAttempt) => {
    const items = attempt.details.items || [];
    const options = attempt.details.options || [];
    const userMatches = attempt.userAnswer?.matches || {};
    const correctMatches = attempt.correctAnswer?.matches || {};
    
    return (
      <div className="space-y-4">
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {attempt.questionText}
        </div>
        
        {attempt.isImageBased && attempt.imageUrl && (
          <div className="my-4">
            <img 
              src={attempt.imageUrl} 
              alt="Question diagram" 
              className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            />
          </div>
        )}
        
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Match</th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Correct Match</th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((item: any, idx: number) => {
                const userOption = options.find((o: any) => o.key === userMatches[item.key]);
                const correctOption = options.find((o: any) => o.key === correctMatches[item.key]);
                const isItemCorrect = userMatches[item.key] === correctMatches[item.key];
                
                return (
                  <tr key={idx} className={isItemCorrect ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">{item.text}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isItemCorrect 
                          ? 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-300'
                      }`}>
                        {userOption ? userOption.text : 'Not answered'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                        {correctOption ? correctOption.text : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isItemCorrect ? (
                        <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                      ) : (
                        <XCircle className="text-red-600 dark:text-red-400" size={18} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMultipleCorrectStatementsQuestion = (attempt: QuestionAttempt) => {
    const rawStatements = attempt.details.statements || [];
    const statements = normalizeStatements(rawStatements);
    const userSelections = attempt.userAnswer?.selectedStatements || [];
    const correctSelections = attempt.correctAnswer?.selectedStatements || [];
    
    return (
      <div className="space-y-4">
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {attempt.questionText}
        </div>
        
        {attempt.isImageBased && attempt.imageUrl && (
          <div className="my-4">
            <img 
              src={attempt.imageUrl} 
              alt="Question diagram" 
              className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            />
          </div>
        )}
        
        <div className="space-y-2 mt-4">
          {statements.map((statement, idx) => {
            const userSelected = userSelections.includes(statement.key);
            const shouldBeSelected = correctSelections.includes(statement.key);
            const isCorrectSelection = (userSelected && shouldBeSelected) || (!userSelected && !shouldBeSelected);
            
            return (
              <div 
                key={idx}
                className={`p-3 rounded-md border-2 ${
                  userSelected && shouldBeSelected
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : userSelected && !shouldBeSelected
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    : !userSelected && shouldBeSelected
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      userSelected && shouldBeSelected
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        : userSelected && !shouldBeSelected
                        ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                        : !userSelected && shouldBeSelected
                        ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {statement.key}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      userSelected && shouldBeSelected
                        ? 'text-green-800 dark:text-green-300'
                        : userSelected && !shouldBeSelected
                        ? 'text-red-800 dark:text-red-300'
                        : !userSelected && shouldBeSelected
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {statement.text}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                    {userSelected && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        Selected
                      </span>
                    )}
                    {shouldBeSelected && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Should select
                      </span>
                    )}
                    {isCorrectSelection ? (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                    ) : (
                      <XCircle className="text-red-600 dark:text-red-400" size={20} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAssertionReasonQuestion = (attempt: QuestionAttempt) => {
    const userAnswer = attempt.userAnswer?.selection || '';
    const correctAnswer = attempt.correctAnswer?.selection || '';
    
    const options = [
      { key: 'A', text: 'Statement I is True, Statement II is True, Statement II is a correct explanation of Statement I' },
      { key: 'B', text: 'Statement I is True, Statement II is True, Statement II is NOT a correct explanation of Statement I' },
      { key: 'C', text: 'Statement I is True, Statement II is False' },
      { key: 'D', text: 'Statement I is False, Statement II is True' },
      { key: 'E', text: 'Statement I is False, Statement II is False' }
    ];
    
    return (
      <div className="space-y-4">
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {attempt.questionText}
        </div>
        
        {attempt.isImageBased && attempt.imageUrl && (
          <div className="my-4">
            <img 
              src={attempt.imageUrl} 
              alt="Question diagram" 
              className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            />
          </div>
        )}
        
        <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
          <div className="mb-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Statement I:</span>
            <p className="text-gray-600 dark:text-gray-400 ml-4">{attempt.details.statement1}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Statement II:</span>
            <p className="text-gray-600 dark:text-gray-400 ml-4">{attempt.details.statement2}</p>
          </div>
        </div>
        
        <div className="space-y-2 mt-4">
          {options.map((option, idx) => {
            const isUserSelection = userAnswer === option.key;
            const isCorrectOption = correctAnswer === option.key;
            const isCorrectSelection = isUserSelection && isCorrectOption;
            const isIncorrectSelection = isUserSelection && !isCorrectOption;
            
            return (
              <div 
                key={idx}
                className={`p-3 rounded-md border-2 ${
                  isCorrectSelection
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : isIncorrectSelection
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    : isCorrectOption
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCorrectSelection
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        : isIncorrectSelection
                        ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                        : isCorrectOption
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.key}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      isCorrectSelection
                        ? 'text-green-800 dark:text-green-300'
                        : isIncorrectSelection
                        ? 'text-red-800 dark:text-red-300'
                        : isCorrectOption
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option.text}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                    {isUserSelection && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        Your answer
                      </span>
                    )}
                    {isCorrectOption && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Correct answer
                      </span>
                    )}
                    {isCorrectSelection && (
                      <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                    )}
                    {isIncorrectSelection && (
                      <XCircle className="text-red-600 dark:text-red-400" size={20} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDiagramBasedQuestion = (attempt: QuestionAttempt) => {
    // This is similar to multiple choice but emphasizes the diagram
    return renderMultipleChoiceQuestion(attempt);
  };

  const renderSequenceOrderingQuestion = (attempt: QuestionAttempt) => {
    const items = attempt.details.items || [];
    const userSequence = attempt.userAnswer?.sequence || [];
    const correctSequence = attempt.correctAnswer?.sequence || [];
    
    return (
      <div className="space-y-4">
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {attempt.questionText}
        </div>
        
        {attempt.isImageBased && attempt.imageUrl && (
          <div className="my-4">
            <img 
              src={attempt.imageUrl} 
              alt="Question diagram" 
              className="max-w-full max-h-96 mx-auto border border-gray-200 dark:border-gray-700 rounded-md"
            />
          </div>
        )}
        
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Your Sequence:</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {userSequence.map((itemKey: string, idx: number) => {
              const item = items.find((i: any) => i.key === itemKey);
              const correctPositionIndex = correctSequence.indexOf(itemKey);
              const isCorrectPosition = correctPositionIndex === idx;
              
              return (
                <div
                  key={idx}
                  className={`relative p-3 rounded-md border-2 ${
                    isCorrectPosition
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="mr-2 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-200">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{item?.text || `Item ${itemKey}`}</p>
                    <div className="ml-2">
                      {isCorrectPosition ? (
                        <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                      ) : (
                        <XCircle className="text-red-600 dark:text-red-400" size={18} />
                      )}
                    </div>
                  </div>
                  {!isCorrectPosition && (
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Correct position: {correctPositionIndex + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Correct Sequence:</h3>
          <div className="flex flex-wrap gap-2">
            {correctSequence.map((itemKey: string, idx: number) => {
              const item = items.find((i: any) => i.key === itemKey);
              
              return (
                <div
                  key={idx}
                  className="p-3 rounded-md border-2 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                >
                  <div className="flex items-center">
                    <div className="mr-2 w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-800 dark:text-green-200">
                      {idx + 1}
                    </div>
                    <p className="text-green-800 dark:text-green-300">{item?.text || `Item ${itemKey}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8"></div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Loading review data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-red-500 dark:text-red-400 mb-6">
          <XCircle size={64} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Error</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{error}</p>
        <div className="flex space-x-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!attempts.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-amber-500 dark:text-amber-400 mb-6">
          <BookOpen size={64} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">No Review Data</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">There are no question attempts to review for this session.</p>
        <div className="flex space-x-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentAttempt = attempts[currentIndex];

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center">
              <Home size={16} className="mr-1" />
              Dashboard
            </Link>
          </div>
          <div>
            <Link href={`/practice-sessions/${sessionId}/summary`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center">
              <BarChart size={16} className="mr-1" />
              Session Summary
            </Link>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Review Session</h1>
        {sessionSummary && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center">
              <CheckCircle size={16} className="mr-1 text-green-600 dark:text-green-400" />
              Score: {sessionSummary.score}/{sessionSummary.maxScore}
            </span>
            <span className="inline-flex items-center">
              <BookOpen size={16} className="mr-1 text-blue-600 dark:text-blue-400" />
              Questions: {sessionSummary.questionsCorrect}/{sessionSummary.totalQuestions} correct
            </span>
            <span className="inline-flex items-center">
              <div className={`w-3 h-3 rounded-full mr-1 ${
                sessionSummary.accuracy >= 80 
                  ? 'bg-green-500 dark:bg-green-400' 
                  : sessionSummary.accuracy >= 60 
                  ? 'bg-yellow-500 dark:bg-yellow-400' 
                  : 'bg-red-500 dark:bg-red-400'
              }`}></div>
              Accuracy: {sessionSummary.accuracy}%
            </span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Question Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 order-2 lg:order-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Questions</h2>
            
            <div className="flex flex-wrap gap-2">
              {attempts.map((attempt, idx) => (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md ${
                    currentIndex === idx
                      ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                      : attempt.isCorrect
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                  } hover:bg-opacity-80 transition duration-150`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="flex items-center mt-6 text-sm">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400 mr-1"></div>
                <span className="text-gray-600 dark:text-gray-400">Correct</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400 mr-1"></div>
                <span className="text-gray-600 dark:text-gray-400">Incorrect</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9 order-1 lg:order-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-sm mr-2">
                  Question {currentIndex + 1} of {attempts.length}
                </span>
                <span className={`px-2 py-1 rounded-md text-sm ${
                  currentAttempt.isCorrect 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                  {currentAttempt.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                  {currentAttempt.marksAwarded}/{currentAttempt.maxMarks} marks
                </span>
              </div>
            </div>
            
            <div className="flex items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-md mr-2">
                {currentAttempt.topic.topicName}
              </span>
              {currentAttempt.subtopic && (
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-md">
                  {currentAttempt.subtopic.subtopicName}
                </span>
              )}
            </div>
            
            {renderQuestionContent(currentAttempt)}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Explanation</h3>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {currentAttempt.explanation || "No explanation available for this question."}
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-md flex items-center ${
                currentIndex === 0
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/30'
              }`}
            >
              <ArrowLeft size={16} className="mr-1" />
              Previous
            </button>
            
            <button
              onClick={goToNext}
              disabled={currentIndex === attempts.length - 1}
              className={`px-4 py-2 rounded-md flex items-center ${
                currentIndex === attempts.length - 1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/30'
              }`}
            >
              Next
              <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
