import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { question_attempts } from '@/db/schema';
import { evaluateAnswer, parseQuestionDetails } from '@/lib/utils/answerEvaluation';
import { cacheService } from '@/lib/services/CacheService';
import { applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { updateSessionStats, updateTopicMasteryBatch } from '@/lib/utilities/sessionUtils';
import { logger } from '@/lib/logger';

// --- Mocks ---


vi.mock('@/db');
vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/utils/answerEvaluation');
vi.mock('@/lib/services/CacheService');
vi.mock('@/lib/middleware/rateLimitMiddleware');
vi.mock('@/lib/utilities/sessionUtils');
vi.mock('@/lib/logger');

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db);
const mockApplyRateLimit = vi.mocked(applyRateLimit);
const mockEvaluateAnswer = vi.mocked(evaluateAnswer);
const mockParseQuestionDetails = vi.mocked(parseQuestionDetails);
const mockCacheService = vi.mocked(cacheService);
const mockUpdateSessionStats = vi.mocked(updateSessionStats);
const mockUpdateTopicMasteryBatch = vi.mocked(updateTopicMasteryBatch);

describe('POST /api/practice-sessions/[sessionId]/submit', () => {
  const mockUserId = 'user_123';
  const mockSessionId = '101';
  const mockSessionIdNum = 101;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Default mock implementations
    mockAuth.mockResolvedValue({ userId: mockUserId } as any);
    mockApplyRateLimit.mockResolvedValue(null);
    mockParseQuestionDetails.mockImplementation((details) => details as any);
    
    // Mock logger to suppress output during tests
    vi.mocked(logger.info).mockImplementation(() => {});
    vi.mocked(logger.warn).mockImplementation(() => {});
    vi.mocked(logger.error).mockImplementation(() => {});
    vi.mocked(logger.debug).mockImplementation(() => {});
  });

  // --- Test Cases ---

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    const request = new NextRequest('http://localhost/api/practice-sessions/101/submit', {
      method: 'POST',
      body: JSON.stringify({ answers: {} }),
    });

    const response = await POST(request, { params: Promise.resolve({ sessionId: mockSessionId }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 404 if session is not found', async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]), // No session found
    } as any);

    const request = new NextRequest('http://localhost/api/practice-sessions/101/submit', {
      method: 'POST',
      body: JSON.stringify({ answers: { '1': 'A' } }),
    });

    const response = await POST(request, { params: Promise.resolve({ sessionId: mockSessionId }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Session not found');
  });

  it('should return success message if session is already completed', async () => {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ session_id: mockSessionIdNum, is_completed: true }]),
    } as any).mockReturnValueOnce({ // Second select for completed stats
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ score: 10, max_score: 20 }]),
    } as any);

    const request = new NextRequest('http://localhost/api/practice-sessions/101/submit', {
      method: 'POST',
      body: JSON.stringify({ answers: { '1': 'A' } }),
    });

    const response = await POST(request, { params: Promise.resolve({ sessionId: mockSessionId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Session already completed');
    expect(body.sessionStats.score).toBe(10);
  });

  it('should successfully process answers and return results', async () => {
    // 1. Mock session check
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ session_id: mockSessionIdNum, is_completed: false }]),
    } as any);

    // 2. Mock fetching session questions and existing attempts
    const mockSessionQuestions = [
      { session_question_id: 1, question_id: 1, details: { options: [] }, marks: 4, negative_marks: 1, question_type: 'MultipleChoice', topic_id: 1 },
      { session_question_id: 2, question_id: 2, details: { options: [] }, marks: 4, negative_marks: 1, question_type: 'MultipleChoice', topic_id: 2 },
    ];
    const mockExistingAttempts: { question_id: number }[] = [];

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockSessionQuestions),
    } as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockExistingAttempts),
    } as any);

    // 3. Mock answer evaluation
    mockEvaluateAnswer
      .mockReturnValueOnce(true) // question 1 is correct
      .mockReturnValueOnce(false); // question 2 is incorrect

    // 4. Mock transaction for inserting attempts
    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    mockDb.transaction.mockImplementation(async (callback) => callback(mockTx as any));

    // 5. Mock session update and returning
    const finalSessionState = {
      questions_attempted: 2,
      questions_correct: 1,
      score: 3,
      max_score: 8,
      is_completed: true,
    };
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([finalSessionState]),
    } as any);

    // --- The Request ---
    const request = new NextRequest('http://localhost/api/practice-sessions/101/submit', {
      method: 'POST',
      body: JSON.stringify({
        answers: {
          '1': 'A',
          '2': 'B',
        },
        timingData: {
          questionTimes: { '1': 15, '2': 20 },
          totalSeconds: 35,
        },
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ sessionId: mockSessionId }) });
    const body = await response.json();

    // --- Assertions ---
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total_answers).toBe(2);
    expect(body.total_correct).toBe(1);
    expect(body.score).toBe(3); // 4 for correct, -1 for incorrect
    expect(body.accuracy).toBe(50);

    // Check results array
    expect(body.results).toEqual([
      { question_id: 1, is_correct: true, marks_awarded: 4 },
      { question_id: 2, is_correct: false, marks_awarded: -1 },
    ]);

    // Verify DB calls
    expect(mockDb.transaction).toHaveBeenCalledOnce();
    const insertCall = vi.mocked(mockTx.insert).mock.calls[0][0];
    expect(insertCall).toBe(question_attempts);
    const valuesCall = vi.mocked(mockTx.values).mock.calls[0][0];
    expect(valuesCall).toHaveLength(2); // Two attempts inserted
    expect(valuesCall[0].is_correct).toBe(true);
    expect(valuesCall[1].is_correct).toBe(false);

    // Verify background tasks were called
    expect(mockUpdateSessionStats).toHaveBeenCalledWith(mockSessionIdNum, mockUserId);
    expect(mockUpdateTopicMasteryBatch).toHaveBeenCalledWith(mockUserId, [
      { topicId: 1, isCorrect: true },
      { topicId: 2, isCorrect: false },
    ]);

    // Verify cache invalidation
    expect(mockCacheService.invalidateUserSessionCaches).toHaveBeenCalledWith(mockUserId, mockSessionIdNum);
  });

  it('should skip questions that have already been attempted', async () => {
    // 1. Mock session check
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ session_id: mockSessionIdNum, is_completed: false }]),
    } as any);

    // 2. Mock fetching session questions and existing attempts
    const mockSessionQuestions = [
      { session_question_id: 1, question_id: 1, details: {}, marks: 4, negative_marks: 1, question_type: 'MCQ', topic_id: 1 },
      { session_question_id: 2, question_id: 2, details: {}, marks: 4, negative_marks: 1, question_type: 'MCQ', topic_id: 2 },
    ];
    // Question 1 already has an attempt
    const mockExistingAttempts = [{ question_id: 1 }];

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockSessionQuestions),
    } as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockExistingAttempts),
    } as any);

    // 3. Mock answer evaluation for question 2
    mockEvaluateAnswer.mockReturnValueOnce(true);

    // 4. Mock transaction
    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    mockDb.transaction.mockImplementation(async (callback) => callback(mockTx as any));

    // 5. Mock final update
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ questions_attempted: 1, questions_correct: 1, score: 4 }]),
    } as any);

    // --- The Request ---
    const request = new NextRequest('http://localhost/api/practice-sessions/101/submit', {
      method: 'POST',
      body: JSON.stringify({
        answers: {
          '1': 'A', // This should be ignored
          '2': 'C', // This should be processed
        },
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ sessionId: mockSessionId }) });
    const body = await response.json();

    // --- Assertions ---
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total_correct).toBe(1);

    // Only one result should be returned
    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toEqual({ question_id: 2, is_correct: true, marks_awarded: 4 });

    // Verify that only one attempt was inserted
    const valuesCall = vi.mocked(mockTx.values).mock.calls[0][0];
    expect(valuesCall).toHaveLength(1);
    expect(valuesCall[0].question_id).toBe(2);
  });

  it('should return 400 for invalid request body', async () => {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ session_id: mockSessionIdNum, is_completed: false }]),
    } as any);

    const request = new NextRequest('http://localhost/api/practice-sessions/101/submit', {
      method: 'POST',
      body: JSON.stringify({
        // Missing 'answers' key, which is required by Zod schema
        wrong_key: {},
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ sessionId: mockSessionId }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid answer submission format');
    expect(body.details).toBeInstanceOf(Array);
  });

  it('should return 500 on a generic server error', async () => {
    // Mock a failure during the session check
    mockDb.select.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const request = new NextRequest('http://localhost/api/practice-sessions/101/submit', {
      method: 'POST',
      body: JSON.stringify({ answers: { '1': 'A' } }),
    });

    const response = await POST(request, { params: Promise.resolve({ sessionId: mockSessionId }) });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(logger.error).toHaveBeenCalledWith(
      'Error processing answer submission',
      expect.objectContaining({
        error: 'Database connection failed',
      })
    );
  });
});


