import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route'; // The API route to test
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/services/CacheService';
import { applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { getCorrectAnswer } from '@/app/practice-sessions/[sessionId]/review/components/helpers';

// Mock Drizzle ORM functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  desc: vi.fn(field => ({ type: 'desc', field })),
  inArray: vi.fn((field, values) => ({ type: 'inArray', field, values })),
}));

// Mock external dependencies
vi.mock('@/db', () => ({
  db: {
    query: { // Mock the query object for Drizzle ORM
      practice_sessions: {
        findFirst: vi.fn(),
      },
      question_attempts: {
        findMany: vi.fn(),
      },
      session_questions: {
        findMany: vi.fn(),
      },
      topics: {
        findMany: vi.fn(),
      },
      subtopics: {
        findMany: vi.fn(),
      },
      questions: {
        findMany: vi.fn(),
      },
    },
  },
}));
vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/cache');
vi.mock('@/lib/logger');
vi.mock('@/lib/services/CacheService');
vi.mock('@/lib/middleware/rateLimitMiddleware');
vi.mock('@/app/practice-sessions/[sessionId]/review/components/helpers');

// Define a mock type for NextResponse that includes 'init'
type MockNextResponse = NextResponse & {
  init?: { status: number };
};

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

// Mock the `withRetry` function to directly execute the provided function by default.
// This allows testing the retry logic by overriding this mock in specific tests.
vi.mock('./route', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./route')>();
  return {
    ...mod,
    withRetry: vi.fn(async (fn: any) => fn()), // Default: just execute the function once
  } as typeof import('./route');
});

// Re-import GET after mocking withRetry to ensure the mocked version is used
import { GET as OriginalGET } from './route';
const GET_MOCKED = OriginalGET; // Use this in tests

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db);
const mockCache = vi.mocked(cache);
const mockLogger = vi.mocked(logger);
const mockCacheService = vi.mocked(cacheService);
const mockApplyRateLimit = vi.mocked(applyRateLimit);
const mockGetCorrectAnswer = vi.mocked(getCorrectAnswer);

// Properly typed database query mocks
const mockPracticeSessionsFindFirst = mockDb.query.practice_sessions.findFirst as any;
const mockQuestionAttemptsFindMany = mockDb.query.question_attempts.findMany as any;
const mockSessionQuestionsFindMany = mockDb.query.session_questions.findMany as any;
const mockQuestionsFindMany = mockDb.query.questions.findMany as any;
const mockTopicsFindMany = mockDb.query.topics.findMany as any;
const mockSubtopicsFindMany = mockDb.query.subtopics.findMany as any;

// Helper to create a mock NextRequest
const createMockRequest = (url: string): NextRequest => {
  return {
    nextUrl: new URL(url),
  } as NextRequest;
};

describe('GET /api/practice-sessions/[sessionId]/review', () => {
  const mockUserId = 'user_test_123';
  const mockSessionId = '101';
  const mockSessionIdNum = 101;
  const mockCacheKey = `session:${mockUserId}:${mockSessionIdNum}:review`;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default successful mocks for common dependencies
    mockAuth.mockResolvedValue({ userId: mockUserId } as any);
    mockApplyRateLimit.mockResolvedValue(null);
    mockCache.get.mockResolvedValue(null); // Default to cache miss
    mockLogger.debug.mockImplementation(() => {});
    mockLogger.info.mockImplementation(() => {});
    mockLogger.warn.mockImplementation(() => {});
    mockLogger.error.mockImplementation(() => {});
    mockCacheService.trackCacheKey.mockResolvedValue(undefined);
    mockCache.set.mockResolvedValue(undefined);
    mockGetCorrectAnswer.mockImplementation((details, type) => ({ type, value: `Correct Answer for ${type}` }) as any);

    // Reset `withRetry` mock to its default behavior (execute once) for each test
    const { withRetry } = await import('./route');
    vi.mocked(withRetry).mockImplementation(async (fn: any) => fn());
  });

  afterEach(() => {
    // Restore original `withRetry` mock if it was overridden in a test
    vi.restoreAllMocks();
  });

  // Test Cases
  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);
    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });
    const jsonResponse = response.body as any;
    expect(jsonResponse).toEqual({ error: 'Unauthorized' });
    expect((response as MockNextResponse).init).toEqual({ status: 401 }); // Access init from the mocked NextResponse
  });

  it('should return 400 for invalid session ID', async () => {
    const request = createMockRequest(`http://localhost/api/practice-sessions/abc/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: 'abc' }) });
     const jsonResponse = response.body as any;
    expect(jsonResponse).toEqual({ error: 'Invalid session ID' });
    expect((response as MockNextResponse).init).toEqual({ status: 400 });
  });

  it('should return rate limit response if hit', async () => {
    const rateLimitResponse = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    mockApplyRateLimit.mockResolvedValue(rateLimitResponse);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });

    expect(response).toBe(rateLimitResponse);
    expect(mockApplyRateLimit).toHaveBeenCalledWith(
      mockUserId,
      `get-session-review:${mockSessionIdNum}`,
      expect.any(Object) // RATE_LIMITS.GET_SESSION_REVIEW
    );
  });

  it('should return cached data if available', async () => {
    const mockCachedData = { session: { session_id: mockSessionIdNum }, questions: [], source: 'cache' };
    mockCache.get.mockResolvedValue(mockCachedData);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });

    expect(mockCache.get).toHaveBeenCalledWith(mockCacheKey);
    const jsonResponse = response.body as any;
    expect(jsonResponse).toEqual(mockCachedData);
    expect((response as MockNextResponse).init).toEqual({ status: 200 });
    expect(mockPracticeSessionsFindFirst).not.toHaveBeenCalled(); // Ensure DB not hit
  });

  it('should return 404 if session not found or unauthorized', async () => {
    mockPracticeSessionsFindFirst.mockResolvedValue(null);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });

    expect(mockPracticeSessionsFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.any(Object) // and(eq(session_id, 101), eq(user_id, 'user_test_123'))
    }));
    expect(response.body).toEqual({ error: 'Session not found or does not belong to the current user' });
    expect((response as MockNextResponse).init).toEqual({ status: 404 });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Session not found or unauthorized',
      expect.any(Object)
    );
  });

  it('should return empty response if no attempts found for the session', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 5,
      questions_attempted: 0,
      questions_correct: 0,
      score: 0,
      max_score: 20,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };
    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue([]); // No attempts
    mockSessionQuestionsFindMany.mockResolvedValue([]); // No session questions
    mockQuestionsFindMany.mockResolvedValue([]); // No questions
    mockTopicsFindMany.mockResolvedValue([]); // No topics
    mockSubtopicsFindMany.mockResolvedValue([]); // No subtopics

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });

    expect(mockQuestionAttemptsFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.any(Object) // and(eq(session_id, 101), eq(user_id, 'user_test_123'))
    }));
    expect(response.body).toEqual({
      session: {
        session_id: mockSessionIdNum,
        session_type: 'Practice',
        start_time: mockSessionDetails.start_time,
        end_time: undefined,
        duration_minutes: undefined,
        subject_name: 'Physics',
        topic_name: undefined,
        subtopic_name: undefined,
        total_questions: 5,
        questions_attempted: 0,
        questions_correct: 0,
        accuracy: 0,
        score: 0,
        max_score: 20,
      },
      attempts: [],
      summary: {
        total_questions: 5,
        questions_attempted: 0,
        questions_correct: 0,
        accuracy: 0,
        score: 0,
        max_score: 20,
      },
      source: 'empty_session_no_attempts'
    });
    expect((response as MockNextResponse).init).toEqual({ status: 200 }); // Access init from the mocked NextResponse
    expect(mockCache.set).toHaveBeenCalledWith(mockCacheKey, expect.any(Object), expect.any(Number));
    expect(mockCacheService.trackCacheKey).toHaveBeenCalledWith(mockUserId, mockCacheKey);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Returning empty session review data',
      expect.any(Object)
    );
  });

  it('should successfully fetch and return detailed session review data', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      end_time: new Date(),
      duration_minutes: 60,
      total_questions: 2,
      questions_attempted: 2,
      questions_correct: 1,
      score: 3,
      max_score: 8,
      subject: { subject_name: 'Physics' },
      topic: { topic_name: 'Mechanics' },
      subtopic: null,
    };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: { selectedOption: 'A' },
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: 'Q1 Text from attempt',
          question_type: 'MultipleChoice',
          details: { options: ['A', 'B'] },
          explanation: 'Exp1 from attempt',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 10,
          subtopic_id: null,
          is_image_based: false,
          image_url: null,
        },
      },
      {
        question_id: 2,
        user_answer: { selectedOption: 'C' },
        is_correct: false,
        marks_awarded: -1,
        attempt_timestamp: new Date(),
        question: {
          question_id: 2,
          question_text: 'Q2 Text from attempt',
          question_type: 'MultipleChoice',
          details: { options: ['C', 'D'] },
          explanation: 'Exp2 from attempt',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'medium',
          topic_id: 11,
          subtopic_id: 20,
          is_image_based: true,
          image_url: 'http://example.com/q2_attempt.png',
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
      { question_id: 2, question_order: 2, time_spent_seconds: 45, is_bookmarked: true },
    ];

    const mockTopics = [{ topic_id: 10, topic_name: 'Topic A' }, { topic_id: 11, topic_name: 'Topic B' }];
    const mockSubtopics = [{ subtopic_id: 20, subtopic_name: 'Subtopic X' }];
    const mockQuestions = [
      {
        question_id: 1,
        question_text: 'Q1 Text from questions table',
        question_type: 'MultipleChoice',
        details: { options: ['A', 'B'], correctOption: 'A' },
        explanation: 'Exp1 from questions table',
        marks: 4,
        negative_marks: 1,
        difficulty_level: 'easy',
        topic_id: 10,
        subtopic_id: null,
        is_image_based: false,
        image_url: null,
      },
      {
        question_id: 2,
        question_text: 'Q2 Text from questions table',
        question_type: 'MultipleChoice',
        details: { options: ['C', 'D'], correctOption: 'D' },
        explanation: 'Exp2 from questions table',
        marks: 4,
        negative_marks: 1,
        difficulty_level: 'medium',
        topic_id: 11,
        subtopic_id: 20,
        is_image_based: true,
        image_url: 'http://example.com/q2_from_questions.png',
      },
    ];

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue(mockTopics);
    mockSubtopicsFindMany.mockResolvedValue(mockSubtopics);
    mockQuestionsFindMany.mockResolvedValue(mockQuestions);

    mockGetCorrectAnswer
      .mockReturnValueOnce({ correctOption: 'A' } as any) // For Q1
      .mockReturnValueOnce({ correctOption: 'D' } as any); // For Q2

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect((response as MockNextResponse).init).toEqual({ status: 200 }); // Access init from the mocked NextResponse
    const responseBody = response.body as any;

    expect(responseBody.session).toEqual({
      session_id: mockSessionIdNum,
      session_type: 'Practice',
      start_time: mockSessionDetails.start_time,
      end_time: mockSessionDetails.end_time,
      duration_minutes: 60,
      subject_name: 'Physics',
      topic_name: 'Mechanics',
      subtopic_name: undefined, // Session subtopic is null
      total_questions: 2,
      questions_attempted: 2,
      questions_correct: 1,
      accuracy: 50,
      score: 3,
      max_score: 8,
    });

    expect(responseBody.questions).toHaveLength(2);
    expect(responseBody.questions[0]).toEqual(expect.objectContaining({
      question_id: 1,
      question_order: 1,
      time_spent_seconds: 30,
      is_bookmarked: false,
      question_text: 'Q1 Text from questions table',
      question_type: 'MultipleChoice',
      details: { options: ['A', 'B'], correctOption: 'A' },
      explanation: 'Exp1 from questions table',
      user_answer: { selectedOption: 'A' },
      is_correct: true,
      correct_answer: { correctOption: 'A' },
      marks_awarded: 4,
      marks_available: 4,
      negative_marks: 1,
      difficulty_level: 'easy',
      topic: { topic_id: 10, topic_name: 'Topic A' },
      subtopic: undefined,
      is_image_based: false,
      image_url: null,
    }));

    expect(responseBody.questions[1]).toEqual(expect.objectContaining({
      question_id: 2,
      question_order: 2,
      time_spent_seconds: 45,
      is_bookmarked: true,
      question_text: 'Q2 Text from questions table',
      question_type: 'MultipleChoice',
      details: { options: ['C', 'D'], correctOption: 'D' },
      explanation: 'Exp2 from questions table',
      user_answer: { selectedOption: 'C' },
      is_correct: false,
      correct_answer: { correctOption: 'D' },
      marks_awarded: -1,
      marks_available: 4,
      negative_marks: 1,
      difficulty_level: 'medium',
      topic: { topic_id: 11, topic_name: 'Topic B' },
      subtopic: { subtopicId: 20, subtopicName: 'Subtopic X' },
      is_image_based: true,
      image_url: 'http://example.com/q2_from_questions.png',
    }));

    expect(mockCache.set).toHaveBeenCalledWith(mockCacheKey, expect.any(Object), expect.any(Number));
    expect(mockCacheService.trackCacheKey).toHaveBeenCalledWith(mockUserId, mockCacheKey);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Retrieved session review data',
      expect.any(Object)
    );
  });

  it('should return 500 on a generic database error', async () => {
    const dbError = new Error('Simulated DB error');
    mockPracticeSessionsFindFirst.mockRejectedValue(dbError); // Simulate error at first DB call

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });

    expect(response.body).toEqual({ error: 'Database error occurred' });
    expect((response as MockNextResponse).init).toEqual({ status: 500 }); // Access init from the mocked NextResponse
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error retrieving session review data',
      expect.objectContaining({ error: dbError.message })
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Database error in session review',
      expect.objectContaining({ error: dbError.message })
    );
  });

  it('should return 503 on Xata concurrency limit error', async () => {
    const concurrencyError = new Error('concurrent connections limit exceeded');
    (concurrencyError as any).code = 'XATA_CONCURRENCY_LIMIT'; // Simulate Xata specific code

    // Mock withRetry to throw this error immediately for testing this path
    vi.mocked((await vi.importActual<typeof import('./route')>('./route')).withRetry).mockImplementation(async (fn: any) => {
      throw concurrencyError;
    });

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });

    expect(response.body).toEqual({ error: 'Database is busy, please try again shortly' });
    expect((response as MockNextResponse).init).toEqual({ status: 503 }); // Access init from the mocked NextResponse
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error retrieving session review data',
      expect.objectContaining({ error: concurrencyError.message })
    );
  });

  it('should return 500 on other unexpected errors', async () => {
    const unexpectedError = new Error('Something completely unexpected happened');
    mockAuth.mockRejectedValue(unexpectedError); // Simulate error before any DB call

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });

    expect(response.body).toEqual({ error: 'An unexpected error occurred' });
    expect((response as MockNextResponse).init).toEqual({ status: 500 }); // Access init from the mocked NextResponse
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error retrieving session review data',
      expect.objectContaining({ error: unexpectedError.message })
    );
  });

  it('should retry database operations on concurrency errors and eventually succeed', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 0,
      questions_attempted: 0,
      questions_correct: 0,
      score: 0,
      max_score: 0,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    let callCount = 0;
    const originalWithRetry = (await vi.importActual<typeof import('./route')>('./route')).withRetry;

    // Mock the internal DB call that `withRetry` wraps
    mockPracticeSessionsFindFirst.mockImplementation(async () => {
      callCount++;
      if (callCount < 2) { // Fail first attempt
        const err = new Error('concurrent connections limit exceeded');
        (err as any).code = 'XATA_CONCURRENCY_LIMIT';
        throw err;
      }
      return mockSessionDetails; // Succeed on second attempt
    });

    // Temporarily use the actual withRetry for this test
    vi.mocked((await vi.importActual<typeof import('./route')>('./route')).withRetry).mockImplementation(originalWithRetry); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) });

    expect(callCount).toBe(2); // Should have been called twice (1 fail + 1 success) // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mockLogger.warn).toHaveBeenCalledTimes(1); // One warning for the retry
    expect((response as MockNextResponse).init).toEqual({ status: 200 });
    expect(response.body).toEqual(expect.objectContaining({
      session: expect.objectContaining({ session_id: mockSessionIdNum }),
      source: 'empty_session_no_attempts' // Since no attempts are mocked after session details
    }));
  });

  it('should retry database operations on concurrency errors and eventually fail after max retries', async () => {
    const concurrencyError = new Error('concurrent connections limit exceeded');
    (concurrencyError as any).code = 'XATA_CONCURRENCY_LIMIT';

    let callCount = 0;
    const originalWithRetry = (await vi.importActual<typeof import('./route')>('./route')).withRetry;

    mockPracticeSessionsFindFirst.mockImplementation(async () => {
      callCount++;
      throw concurrencyError; // Always fail
    });

    vi.mocked((await vi.importActual<typeof import('./route')>('./route')).withRetry).mockImplementation(originalWithRetry); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect(callCount).toBe(3); // MAX_RETRIES is 3, so 3 attempts
    expect(mockLogger.warn).toHaveBeenCalledTimes(2); // Warnings for first two retries
    expect(response.body).toEqual({ error: 'Database is busy, please try again shortly' });
    expect((response as MockNextResponse).init).toEqual({ status: 503 });
  });

  it('should handle missing question details or type for getCorrectAnswer', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 1,
      questions_attempted: 1,
      questions_correct: 1,
      score: 4,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: { selectedOption: 'A' },
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: 'Q1 Text',
          question_type: 'MultipleChoice',
          details: null, // Simulate missing details
          explanation: 'Exp1',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 10,
          subtopic_id: null,
          is_image_based: false,
          image_url: null,
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    const mockTopics = [{ topic_id: 10, topic_name: 'Topic A' }];
    const mockQuestions = [
      {
        question_id: 1,
        question_text: 'Q1 Text from questions table',
        question_type: 'MultipleChoice',
        details: null, // Simulate missing details
        explanation: 'Exp1 from questions table',
        marks: 4,
        negative_marks: 1,
        difficulty_level: 'easy',
        topic_id: 10,
        subtopic_id: null,
        is_image_based: false,
        image_url: null,
      },
    ];

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue(mockTopics);
    mockSubtopicsFindMany.mockResolvedValue([]);
    mockQuestionsFindMany.mockResolvedValue(mockQuestions);

    mockGetCorrectAnswer.mockReturnValue(undefined as any); // Simulate getCorrectAnswer returning undefined

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect((response as MockNextResponse).init).toEqual({ status: 200 });
    const responseBody = response.body as any;
    expect(responseBody.questions[0].correct_answer).toBeUndefined();
    expect(mockGetCorrectAnswer).toHaveBeenCalledWith(undefined, 'MultipleChoice'); // Called with undefined details
  });

  it('should use question_text from attempt if questions table data is missing', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 1,
      questions_attempted: 1,
      questions_correct: 1,
      score: 4,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: { selectedOption: 'A' },
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: 'Q1 Text from attempt', // This should be used
          question_type: 'MultipleChoice',
          details: { options: ['A', 'B'] },
          explanation: 'Exp1',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 10,
          subtopic_id: null,
          is_image_based: false,
          image_url: null,
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    const mockTopics = [{ topic_id: 10, topic_name: 'Topic A' }];
    // Simulate questions.findMany returning an empty array or question not found // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockQuestionsFindMany.mockResolvedValue([]);

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue(mockTopics);
    mockSubtopicsFindMany.mockResolvedValue([]);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect((response as MockNextResponse).init).toEqual({ status: 200 });
    const responseBody = response.body as any;
    expect(responseBody.questions[0].question_text).toBe('Q1 Text from attempt');
  });

  it('should use "Question data missing" if both question and attempt data are missing', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 1,
      questions_attempted: 1,
      questions_correct: 1,
      score: 4,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: { selectedOption: 'A' },
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: null, // Simulate missing text
          question_type: 'MultipleChoice',
          details: { options: ['A', 'B'] },
          explanation: 'Exp1',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 10,
          subtopic_id: null,
          is_image_based: false,
          image_url: null,
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    const mockTopics = [{ topic_id: 10, topic_name: 'Topic A' }];
    // Simulate questions.findMany returning an empty array or question not found // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockQuestionsFindMany.mockResolvedValue([]);

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue(mockTopics);
    mockSubtopicsFindMany.mockResolvedValue([]);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect((response as MockNextResponse).init).toEqual({ status: 200 });
    const responseBody = response.body as any;
    expect(responseBody.questions[0].question_text).toBe('Question data missing');
  });

  it('should use topic_id/subtopic_id from attempt if questions table data is missing', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 1,
      questions_attempted: 1,
      questions_correct: 1,
      score: 4,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: { selectedOption: 'A' },
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: 'Q1 Text',
          question_type: 'MultipleChoice',
          details: { options: ['A', 'B'] },
          explanation: 'Exp1',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 10, // This should be used
          subtopic_id: 20, // This should be used
          is_image_based: false,
          image_url: null,
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    const mockTopics = [{ topic_id: 10, topic_name: 'Topic A' }];
    const mockSubtopics = [{ subtopic_id: 20, subtopic_name: 'Subtopic X' }];

    // Simulate questions.findMany returning an empty array or question not found // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockQuestionsFindMany.mockResolvedValue([]);

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue(mockTopics);
    mockSubtopicsFindMany.mockResolvedValue(mockSubtopics);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect((response as MockNextResponse).init).toEqual({ status: 200 });
    const responseBody = response.body as any;
    expect(responseBody.questions[0].topic).toEqual({ topic_id: 10, topic_name: 'Topic A' });
    expect(responseBody.questions[0].subtopic).toEqual({ subtopicId: 20, subtopicName: 'Subtopic X' });
  });

  it('should use is_image_based/image_url from attempt if questions table data is missing', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 1,
      questions_attempted: 1,
      questions_correct: 1,
      score: 4,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: { selectedOption: 'A' },
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: 'Q1 Text',
          question_type: 'MultipleChoice',
          details: { options: ['A', 'B'] },
          explanation: 'Exp1',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 10,
          subtopic_id: null,
          is_image_based: true, // This should be used
          image_url: 'http://attempt.image.url', // This should be used
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    const mockTopics = [{ topic_id: 10, topic_name: 'Topic A' }];

    // Simulate questions.findMany returning an empty array or question not found // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockQuestionsFindMany.mockResolvedValue([]);

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue(mockTopics);
    mockSubtopicsFindMany.mockResolvedValue([]);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect((response as MockNextResponse).init).toEqual({ status: 200 });
    const responseBody = response.body as any;
    expect(responseBody.questions[0].is_image_based).toBe(true);
    expect(responseBody.questions[0].image_url).toBe('http://attempt.image.url');
  });

  it('should set topic_name to "Unknown Topic" if topic data is missing', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 1,
      questions_attempted: 1,
      questions_correct: 1,
      score: 4,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: { selectedOption: 'A' },
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: 'Q1 Text',
          question_type: 'MultipleChoice',
          details: { options: ['A', 'B'] },
          explanation: 'Exp1',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 999, // Non-existent topic
          subtopic_id: null,
          is_image_based: false,
          image_url: null,
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue([]); // No topics found
    mockSubtopicsFindMany.mockResolvedValue([]);
    mockQuestionsFindMany.mockResolvedValue([]);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const responseBody = response.body as any;
    expect(responseBody.questions[0].topic).toEqual({ topic_id: undefined, topic_name: 'Unknown Topic' });
  });

  it('should set subtopic to undefined if subtopic data is missing', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 1,
      questions_attempted: 1,
      questions_correct: 1,
      score: 4,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: { selectedOption: 'A' },
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: 'Q1 Text',
          question_type: 'MultipleChoice',
          details: { options: ['A', 'B'] },
          explanation: 'Exp1',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 10,
          subtopic_id: 999, // Non-existent subtopic
          is_image_based: false,
          image_url: null,
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    const mockTopics = [{ topic_id: 10, topic_name: 'Topic A' }];

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue(mockTopics);
    mockSubtopicsFindMany.mockResolvedValue([]); // No subtopics found
    mockQuestionsFindMany.mockResolvedValue([]);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const responseBody = response.body as any;
    expect(responseBody.questions[0].subtopic).toBeUndefined();
  });

  it('should handle questions with no attempts (is_correct null)', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 1,
      questions_attempted: 0,
      questions_correct: 0,
      score: 0,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const mockAttempts: any[] = []; // No attempts

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    const mockQuestions = [
      {
        question_id: 1,
        question_text: 'Q1 Text',
        question_type: 'MultipleChoice',
        details: { options: ['A', 'B'], correctOption: 'A' },
        explanation: 'Exp1',
        marks: 4,
        negative_marks: 1,
        difficulty_level: 'easy',
        topic_id: 10,
        subtopic_id: null,
        is_image_based: false,
        image_url: null,
      },
    ];

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue([{ topic_id: 10, topic_name: 'Topic A' }]);
    mockSubtopicsFindMany.mockResolvedValue([]);
    mockQuestionsFindMany.mockResolvedValue(mockQuestions);

    mockGetCorrectAnswer.mockReturnValue({ correctOption: 'A' } as any);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect((response as MockNextResponse).init).toEqual({ status: 200 });
    const responseBody = response.body as any;
    expect(responseBody.questions).toHaveLength(1);
    expect(responseBody.questions[0].is_correct).toBeNull();
    expect(responseBody.questions[0].user_answer).toBeUndefined();
    expect(responseBody.questions[0].marks_awarded).toBe(0);
  });

  it('should handle empty session_questions data gracefully', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      total_questions: 0,
      questions_attempted: 0,
      questions_correct: 0,
      score: 0,
      max_score: 0,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue([]);
    mockSessionQuestionsFindMany.mockResolvedValue([]); // Empty session questions
    mockQuestionsFindMany.mockResolvedValue([]);
    mockTopicsFindMany.mockResolvedValue([]);
    mockSubtopicsFindMany.mockResolvedValue([]);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const responseBody = response.body as any;
    expect(responseBody.questions).toHaveLength(0);
    expect(responseBody.session.total_questions).toBe(0);
  });

  it('should deep copy complex objects in responseData', async () => {
    const mockSessionDetails = {
      session_id: mockSessionIdNum,
      user_id: mockUserId,
      session_type: 'Practice',
      start_time: new Date(),
      end_time: new Date(),
      duration_minutes: 60,
      total_questions: 1,
      questions_attempted: 1,
      questions_correct: 1,
      score: 4,
      max_score: 4,
      subject: { subject_name: 'Physics' },
      topic: null,
      subtopic: null,
    };

    const complexDetails = {
      options: [{ id: 1, text: 'A' }, { id: 2, text: 'B' }],
      correctOption: { id: 1, text: 'A' },
      nested: { key: 'value', arr: [1, 2] }
    };
    const complexUserAnswer = { selected: [{ id: 1, text: 'A' }], meta: { time: 10 } };

    const mockAttempts = [
      {
        question_id: 1,
        user_answer: complexUserAnswer,
        is_correct: true,
        marks_awarded: 4,
        attempt_timestamp: new Date(),
        question: {
          question_id: 1,
          question_text: 'Q1 Text',
          question_type: 'MultipleChoice',
          details: complexDetails,
          explanation: 'Exp1',
          marks: 4,
          negative_marks: 1,
          difficulty_level: 'easy',
          topic_id: 10,
          subtopic_id: null,
          is_image_based: false,
          image_url: null,
        },
      },
    ];

    const mockSessionQuestions = [
      { question_id: 1, question_order: 1, time_spent_seconds: 30, is_bookmarked: false },
    ];

    const mockTopics = [{ topic_id: 10, topic_name: 'Topic A' }];
    const mockQuestions = [
      {
        question_id: 1,
        question_text: 'Q1 Text from questions table',
        question_type: 'MultipleChoice',
        details: complexDetails,
        explanation: 'Exp1 from questions table',
        marks: 4,
        negative_marks: 1,
        difficulty_level: 'easy',
        topic_id: 10,
        subtopic_id: null,
        is_image_based: false,
        image_url: null,
      },
    ];

    mockPracticeSessionsFindFirst.mockResolvedValue(mockSessionDetails);
    mockQuestionAttemptsFindMany.mockResolvedValue(mockAttempts);
    mockSessionQuestionsFindMany.mockResolvedValue(mockSessionQuestions);
    mockTopicsFindMany.mockResolvedValue(mockTopics);
    mockSubtopicsFindMany.mockResolvedValue([]);
    mockQuestionsFindMany.mockResolvedValue(mockQuestions);

    mockGetCorrectAnswer.mockReturnValue(complexDetails.correctOption as any);

    const request = createMockRequest(`http://localhost/api/practice-sessions/${mockSessionId}/review`);
    const response = await GET_MOCKED(request, { params: Promise.resolve({ sessionId: mockSessionId }) }); // eslint-disable-next-line @typescript-eslint/no-explicit-any

    expect((response as MockNextResponse).init).toEqual({ status: 200 }); // Access init from the mocked NextResponse
    const responseBody = response.body as any;

    // Verify deep copies
    expect(responseBody.questions[0].details).toEqual(complexDetails);
    expect(responseBody.questions[0].details).not.toBe(complexDetails); // Should be a different object reference

    expect(responseBody.questions[0].user_answer).toEqual(complexUserAnswer);
    expect(responseBody.questions[0].user_answer).not.toBe(complexUserAnswer); // Should be a different object reference

    expect(responseBody.questions[0].correct_answer).toEqual(complexDetails.correctOption);
    expect(responseBody.questions[0].correct_answer).not.toBe(complexDetails.correctOption); // Should be a different object reference
  });

});