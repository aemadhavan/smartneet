export interface QuestionAttempt {
    questionId: number;
    questionNumber: number;
    timeSpentSeconds: number;
    questionText: string;
    questionType: 'MultipleChoice' | 'Matching' | 'MultipleCorrectStatements' | 'AssertionReason' | 'DiagramBased' | 'SequenceOrdering';
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
  
  export interface SessionSummary {
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
