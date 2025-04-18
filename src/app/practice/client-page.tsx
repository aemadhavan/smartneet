// File: src/app/practice/client-page.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SessionCompletePage from './complete';
import { 
  SubjectSelector, 
  QuestionNavigator, 
  LoadingSpinner, 
  ErrorDisplay 
} from './components/ui';
import { 
  QuestionDisplay 
} from './components/questions';
import { 
  useSubjects, 
  usePracticeSession 
} from './hooks';
import { Subject } from './types';

export default function PracticeClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject')?.toLowerCase();
  const topicIdParam = searchParams.get('topicId');
  const subtopicIdParam = searchParams.get('subtopicId');
  
  // Parse topic and subtopic IDs if they exist
  const topicId = topicIdParam ? parseInt(topicIdParam) : null;
  const subtopicId = subtopicIdParam ? parseInt(subtopicIdParam) : null;
  
  // Custom hooks for data fetching and state management
  const { 
    subjects, 
    loading: subjectsLoading, 
    error: subjectsError,
    selectedSubject,
    setSelectedSubject 
  } = useSubjects(subjectParam);
  
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    userAnswers,
    handleOptionSelect,
    handleNextQuestion,
    handleCompleteSession,
    handleStartNewSession,
    sessionCompleted
  } = usePracticeSession(selectedSubject, setSelectedSubject, topicId, subtopicId); // Pass topic and subtopic IDs

  // Derived loading and error states
  const loading = subjectsLoading || sessionLoading;
  const error = subjectsError || sessionError;

  // Handle retry button click
  const handleRetry = () => {
    if (selectedSubject) {
      const tempSubject = { ...selectedSubject };
      setSelectedSubject(null);
      setTimeout(() => setSelectedSubject(tempSubject), 100);
    }
  };

  // Handle subject selection
  const handleSubjectSelect = (subject: Subject) => {
    // Preserve topic and subtopic IDs when changing subject if they were specified
    let url = `/practice?subject=${subject.subject_name.toLowerCase()}`;
    if (topicId) url += `&topicId=${topicId}`;
    if (subtopicId) url += `&subtopicId=${subtopicId}`;
    router.push(url);
  };

  // If session is completed, show the completion page
  if (sessionCompleted && session) {
    return (
      <SessionCompletePage
        sessionId={session.sessionId}
        onStartNewSession={handleStartNewSession}
      />
    );
  }

  // Render loading state
  if (loading) {
    return <LoadingSpinner message="Loading practice session..." />;
  }

  // Render error state
  if (error) {
    return <ErrorDisplay message={error} onRetry={handleRetry} />;
  }

  // Render subject selection if no subject is selected
  if (!selectedSubject) {
    return <SubjectSelector subjects={subjects} onSelect={handleSubjectSelect} />;
  }

  // Create session title based on filtering parameters
  const getSessionTitle = () => {
    let title = `${selectedSubject.subject_name} Practice`;
    
    // Add topic information if filtering by topic
    if (topicId && session?.questions && session.questions.length > 0) {
      const firstQuestion = session.questions[0];
      if (firstQuestion.topic_name) {
        title = `${firstQuestion.topic_name} Practice`;
      }
    }
    
    // Add subtopic information if filtering by subtopic
    if (subtopicId && session?.questions && session.questions.length > 0) {
      const firstQuestion = session.questions[0];
      if (firstQuestion.subtopic_name) {
        title = `${firstQuestion.subtopic_name} Practice`;
      }
    }
    
    return title;
  };

  // Render practice session
  if (session && session.questions && session.questions.length > 0) {
    const currentQuestion = session.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === session.questions.length - 1;
    const selectedOption = userAnswers[currentQuestion.question_id] || null;
    
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{getSessionTitle()}</h1>
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {session.questions.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%` }}
          />
        </div>

        <QuestionDisplay
          question={currentQuestion}
          selectedOption={selectedOption}
          onOptionSelect={handleOptionSelect}
          onNextQuestion={handleNextQuestion}
          onCompleteSession={handleCompleteSession}
          isLastQuestion={isLastQuestion}
          onPreviousQuestion={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          currentQuestionIndex={currentQuestionIndex}
        />

        {/* Question navigation */}
        <QuestionNavigator
          questions={session.questions}
          currentIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          onQuestionSelect={setCurrentQuestionIndex}
        />
      </div>
    );
  }

  // Fallback if session is created but no questions
  return (
    <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Questions Available</h2>
      <p className="text-gray-600 mb-8">
        {topicId 
          ? "No questions are available for this topic at the moment." 
          : subtopicId 
            ? "No questions are available for this subtopic at the moment."
            : "No questions are available for this subject at the moment."
        }
      </p>
      <Link
        href="/biology/bot"
        className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-200"
      >
        Back to Botany
      </Link>
    </div>
  );
}