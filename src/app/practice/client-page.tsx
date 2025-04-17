'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SessionCompletePage from './complete';

interface Subject {
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

// Define question details types for each question type
interface MultipleChoiceOption {
  option_number: string;
  option_text: string;
}
interface MatchingItem {
  left_item_label: string;
  left_item_text: string;
  right_item_label: string;
  right_item_text: string;
}
interface Statement {
  statement_label: string;
  statement_text: string;
}
interface SequenceItem {
  item_number: string;
  item_text: string;
}
interface QuestionOption {
  option_number: string;
  option_text: string;
}

// Define the possible structures for details based on question type
interface MultipleChoiceDetails {
  options: MultipleChoiceOption[];
}
interface MatchingDetails {
  left_column_header?: string;
  right_column_header?: string;
  items: MatchingItem[];
  options: QuestionOption[];
}
interface AssertionReasonDetails {
  statements: Statement[];
  options: QuestionOption[];
}
interface MultipleCorrectStatementsDetails {
  statements: Statement[];
  options: QuestionOption[];
}
interface SequenceOrderingDetails {
  sequence_items: SequenceItem[];
  options: QuestionOption[];
}

// Union type for all question details
type QuestionDetails =
  | MultipleChoiceDetails
  | MatchingDetails
  | AssertionReasonDetails
  | MultipleCorrectStatementsDetails
  | SequenceOrderingDetails;

interface Question {
  question_id: number;
  question_text: string;
  question_type: string;
  details: string | QuestionDetails;
  explanation: string;
  difficulty_level: string;
  marks: number;
  negative_marks: number;
  topic_id: number;
  topic_name: string;
  subtopic_id: number | null;
  subtopic_name: string | null;
}

interface SessionResponse {
  sessionId: number;
  questions: Question[];
}

export default function PracticeClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject')?.toLowerCase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Explicitly type userAnswers as Record<number, string>
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Step 1: Fetch available subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/subjects?isActive=true');
        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }
        const data = await response.json();
        setSubjects(data.data || []);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      }
    };
    fetchSubjects();
  }, []);

  // Step 2: Match subject from URL parameter to fetched subjects
  useEffect(() => {
    if (subjects.length > 0 && subjectParam) {
      const matchedSubject = subjects.find(
        (s) =>
          s.subject_name.toLowerCase() === subjectParam ||
          s.subject_code.toLowerCase() === subjectParam
      );
      if (matchedSubject) {
        setSelectedSubject(matchedSubject);
      } else {
        setError(`Subject "${subjectParam}" not found. Please select a valid subject.`);
        setLoading(false);
      }
    } else if (subjects.length > 0 && !subjectParam) {
      setLoading(false);
    }
  }, [subjects, subjectParam]);

  // Step 3: Create a new practice session when subject is selected
  useEffect(() => {
    const createSession = async () => {
      if (!selectedSubject) return;
      try {
        setLoading(true);
        setError(null);
        setSessionCompleted(false);
        setUserAnswers({});
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
        console.log('Session data:', sessionData);
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
    if (session && session.questions[currentQuestionIndex]) {
      const questionId = session.questions[currentQuestionIndex].question_id;
      setSelectedOption(userAnswers[questionId] || null);
    }
  }, [currentQuestionIndex, userAnswers, session]);

  // Handle retry button click
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (selectedSubject) {
      const tempSubject = { ...selectedSubject };
      setSelectedSubject(null);
      setTimeout(() => setSelectedSubject(tempSubject), 100);
    } else {
      setLoading(false);
    }
  };

  // Handle subject selection
  const handleSubjectSelect = (subject: Subject) => {
    router.push(`/practice?subject=${subject.subject_name.toLowerCase()}`);
  };

  // Handle option selection
  const handleOptionSelect = (optionNumber: string) => {
    if (!session) return;
    setSelectedOption(optionNumber);
    const questionId = session.questions[currentQuestionIndex].question_id;
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
    if (selectedSubject) {
      const tempSubject = { ...selectedSubject };
      setSelectedSubject(null);
      setTimeout(() => setSelectedSubject(tempSubject), 100);
    }
  };

  // Safely parse the details JSON if it's a string
  const parseDetails = (question: Question): QuestionDetails | null => {
    if (!question.details) return null;
    if (typeof question.details === 'string') {
      try {
        const parsed = JSON.parse(question.details);
        return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      } catch (e) {
        console.error('Failed to parse question details:', e);
        return null;
      }
    }
    return question.details as QuestionDetails;
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
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mb-8"></div>
        <p className="text-gray-600 text-lg">Loading practice session...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-red-500 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Failed to load practice session</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render subject selection if no subject is selected
  if (!selectedSubject) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Select a Subject</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div
              key={subject.subject_id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition duration-200 cursor-pointer"
              onClick={() => handleSubjectSelect(subject)}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{subject.subject_name}</h2>
              <p className="text-sm text-gray-500">{subject.subject_code}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render practice session
  if (session && session.questions.length > 0) {
    const currentQuestion = session.questions[currentQuestionIndex];
    const details = parseDetails(currentQuestion);
    const isLastQuestion = currentQuestionIndex === session.questions.length - 1;

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{selectedSubject.subject_name} Practice</h1>
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium text-gray-600">
              {currentQuestion.topic_name}
              {currentQuestion.subtopic_name && ` › ${currentQuestion.subtopic_name}`}
            </span>
            <span
              className={`text-sm font-medium ${
                currentQuestion.difficulty_level === 'easy'
                  ? 'text-green-600'
                  : currentQuestion.difficulty_level === 'medium'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {currentQuestion.difficulty_level.charAt(0).toUpperCase() +
                currentQuestion.difficulty_level.slice(1)}
            </span>
          </div>
          <div className="text-lg text-gray-800 mb-6">
            <div dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }} />
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Question type: {currentQuestion.question_type}
          </div>

          {/* Multiple Choice Questions */}
          {currentQuestion.question_type === 'MultipleChoice' &&
            details &&
            'options' in details && (
              <div className="space-y-3">
                {details.options.map((option, index) => (
                  <div
                    key={index}
                    className={`border rounded-md p-4 cursor-pointer ${
                      selectedOption === option.option_number
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleOptionSelect(option.option_number)}
                  >
                    <div className="flex items-start">
                      <span className="font-medium mr-2">{option.option_number.toUpperCase()}.</span>
                      <div dangerouslySetInnerHTML={{ __html: option.option_text }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Matching Questions */}
          {currentQuestion.question_type === 'Matching' &&
            details &&
            'items' in details &&
            'options' in details && (
              <div>
                <div className="mb-6 overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border px-4 py-2 bg-gray-50">
                          {details.left_column_header || 'List I'}
                        </th>
                        <th className="border px-4 py-2 bg-gray-50">
                          {details.right_column_header || 'List II'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border px-4 py-2">
                            <span className="font-medium mr-2">{item.left_item_label}.</span>
                            {item.left_item_text}
                          </td>
                          <td className="border px-4 py-2">
                            <span className="font-medium mr-2">{item.right_item_label}.</span>
                            {item.right_item_text}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 space-y-3">
                  {details.options.map((option, index) => (
                    <div
                      key={index}
                      className={`border rounded-md p-4 cursor-pointer ${
                        selectedOption === option.option_number
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleOptionSelect(option.option_number)}
                    >
                      <div className="flex items-start">
                        <span className="font-medium mr-2">{option.option_number.toUpperCase()}.</span>
                        <div dangerouslySetInnerHTML={{ __html: option.option_text }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Assertion-Reason Questions */}
          {currentQuestion.question_type === 'AssertionReason' &&
            details &&
            'statements' in details &&
            'options' in details && (
              <div>
                <div className="mb-6 space-y-4 border-b pb-4">
                  {details.statements.map((statement, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium mb-1">{statement.statement_label}:</p>
                      <p dangerouslySetInnerHTML={{ __html: statement.statement_text }} />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {details.options.map((option, index) => (
                    <div
                      key={index}
                      className={`border rounded-md p-4 cursor-pointer ${
                        selectedOption === option.option_number
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleOptionSelect(option.option_number)}
                    >
                      <div className="flex items-start">
                        <span className="font-medium mr-2">{option.option_number.toUpperCase()}.</span>
                        <div dangerouslySetInnerHTML={{ __html: option.option_text }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Multiple Correct Statements */}
          {currentQuestion.question_type === 'MultipleCorrectStatements' &&
            details &&
            'statements' in details &&
            'options' in details && (
              <div>
                <div className="mb-6 space-y-3 border-b pb-4">
                  {details.statements.map((statement, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="flex">
                        <span className="font-medium mr-2">{statement.statement_label}:</span>
                        <div dangerouslySetInnerHTML={{ __html: statement.statement_text }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {details.options.map((option, index) => (
                    <div
                      key={index}
                      className={`border rounded-md p-4 cursor-pointer ${
                        selectedOption === option.option_number
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleOptionSelect(option.option_number)}
                    >
                      <div className="flex items-start">
                        <span className="font-medium mr-2">{option.option_number.toUpperCase()}.</span>
                        <div dangerouslySetInnerHTML={{ __html: option.option_text }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Sequence Ordering */}
          {currentQuestion.question_type === 'SequenceOrdering' &&
            details &&
            'sequence_items' in details &&
            'options' in details && (
              <div>
                <div className="mb-6 space-y-2 border-b pb-4">
                  <p className="font-medium mb-2">Arrange in correct sequence:</p>
                  {details.sequence_items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded mb-2">
                      <div className="flex">
                        <span className="font-medium mr-2">{item.item_number}.</span>
                        <div dangerouslySetInnerHTML={{ __html: item.item_text }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {details.options.map((option, index) => (
                    <div
                      key={index}
                      className={`border rounded-md p-4 cursor-pointer ${
                        selectedOption === option.option_number
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleOptionSelect(option.option_number)}
                    >
                      <div className="flex items-start">
                        <span className="font-medium mr-2">{option.option_number.toUpperCase()}.</span>
                        <div dangerouslySetInnerHTML={{ __html: option.option_text }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Fallback if no known question type is matched */}
          {!details && (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-6">
              <p className="text-yellow-700 font-medium">Question details format not recognized</p>
              <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(currentQuestion.details, null, 2)}
              </pre>
            </div>
          )}

          {/* Navigation and submit buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded ${
                currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Previous
            </button>
            <div className="flex space-x-4">
              {isLastQuestion ? (
                <button
                  onClick={handleCompleteSession}
                  className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition duration-200"
                >
                  Finish Session
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition duration-200"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Question Navigator</h3>
          <div className="flex flex-wrap gap-2">
            {session.questions.map((q, idx) => (
              <button
                key={q.question_id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${idx === currentQuestionIndex
                    ? 'bg-indigo-600 text-white'
                    : userAnswers[q.question_id]
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback if session is created but no questions
  return (
    <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Questions Available</h2>
      <p className="text-gray-600 mb-8">No questions are available for this subject at the moment.</p>
      <Link
        href="/"
        className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-200"
      >
        Back to Home
      </Link>
    </div>
  );
}
