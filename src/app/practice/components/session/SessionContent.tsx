// src/app/practice/components/session/SessionContent.tsx
import { memo } from 'react';
import { QuestionDisplay } from '../questions';
import { QuestionNavigator } from '../ui';
import { SessionHeader } from './SessionHeader';
import { FreeAccessBanner } from './FreeAccessBanner';
import SubscriptionLimitDisplay from '@/components/subscription/SubscriptionLimitDisplay';
import SubscriptionLimitNotification from '@/components/subscription/SubscriptionLimitNotification';
import { Question } from '@/app/practice/types';

interface LimitStatus {
  canTake: boolean;
  reason?: string | null;
  remaining?: number;
  total?: number;
}

interface SessionContentProps {
  session: {
    sessionId: number;
    questions: Question[];
  };
  title: string;
  currentQuestionIndex: number;
  userAnswers: Record<number, string>;
  isPremium: boolean;
  limitParam?: string | null;
  limitStatus: LimitStatus | null;
  limitsRefreshKey: number;
  showLimitNotification: boolean;
  limitMessage: string;
  setCurrentQuestionIndex: (index: number) => void;
  handleOptionSelect: (questionId: number, option: string) => void;
  handleNextQuestion: () => void;
  handleCompleteSession: () => void;
}

const SessionContent = memo(function SessionContent({
  session,
  title,
  currentQuestionIndex,
  userAnswers,
  isPremium,
  limitParam,
  limitStatus,
  limitsRefreshKey,
  showLimitNotification,
  limitMessage,
  setCurrentQuestionIndex,
  handleOptionSelect,
  handleNextQuestion,
  handleCompleteSession
}: SessionContentProps) {
  const currentQuestion = session.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === session.questions.length - 1;
  const selectedOption = userAnswers[currentQuestion.question_id] || null;

  return (
    <div className="container mx-auto py-8 px-4">
      <SessionHeader
        title={title}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={session.questions.length}
      >
        {/* Subscription limit info component */}
        {limitStatus && <SubscriptionLimitDisplay refreshKey={limitsRefreshKey} />}
      </SessionHeader>

      {!isPremium && limitParam === 'free' && (
        <FreeAccessBanner />
      )}

      {/* Question display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
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
      </div>

      {/* Navigation */}
      <QuestionNavigator
        questions={session.questions}
        currentIndex={currentQuestionIndex}
        userAnswers={userAnswers}
        onQuestionSelect={setCurrentQuestionIndex}
      />

      {/* Limit notification */}
      {showLimitNotification && 
        <SubscriptionLimitNotification 
          message={limitMessage}
        />
      }
    </div>
  );
});

export { SessionContent };