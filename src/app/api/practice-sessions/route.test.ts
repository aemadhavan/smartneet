import { NextRequest, NextResponse } from 'next/server';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET, PATCH } from './route';
import { db } from '@/db';
import { cache } from '@/lib/cache';
import { auth } from '@clerk/nextjs/server';
import { applyRateLimit, RATE_LIMITS, CACHE_TTLS } from '@/lib/middleware/rateLimitMiddleware';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/services/CacheService';
import { practiceSessionManager } from '@/lib/services/PracticeSessionManager';
import { z } from 'zod';

// --- MOCKS ---

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/middleware/rateLimitMiddleware', () => ({
  applyRateLimit: vi.fn(),
  RATE_LIMITS: {
    CREATE_SESSION: { points: 1, duration: 1 },
    GET_SESSIONS: { points: 1, duration: 1 },
    UPDATE_SESSION: { points: 1, duration: 1 },
  },
  CACHE_TTLS: {
    SESSION_CACHE: 3600,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/services/CacheService', () => ({
  cacheService: {
    trackCacheKey: vi.fn(),
    invalidateUserSessionCaches: vi.fn(),
  },
}));

vi.mock('@/lib/services/PracticeSessionManager', () => ({
  practiceSessionManager: {
    createSession: vi.fn(),
  },
}));

const updateSetWhereMock = vi.fn();
const updateSetMock = vi.fn(() => ({ where: updateSetWhereMock }));

const selectFromWhereLimitMock = vi.fn();
const selectFromWhereOrderByLimitOffsetMock = vi.fn();
const selectFromWhereOrderByLimitMock = vi.fn(() => ({ offset: selectFromWhereOrderByLimitOffsetMock }));
const selectFromWhereOrderByMock = vi.fn(() => ({ limit: selectFromWhereOrderByLimitMock }));
const selectFromWhereMock = vi.fn();
const selectFromLeftJoinMock = vi.fn(() => ({ leftJoin: selectFromLeftJoinMock, where: selectFromWhereMock }));
const selectFromMock = vi.fn(() => ({ leftJoin: selectFromLeftJoinMock, where: selectFromWhereMock }));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({ from: selectFromMock })),
    update: vi.fn(() => ({ set: updateSetMock })),
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  count: vi.fn(field => `count(${field})`),
  and: vi.fn((...conditions) => `and(${conditions.join(', ')})`),
  eq: vi.fn((field, value) => `eq(${field}, ${value})`),
  desc: vi.fn(field => `desc(${field})`),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

vi.mock('@/db/schema', () => ({
  practice_sessions: {}, subjects: {}, topics: {},
}));

// --- HELPERS ---

const createMockRequest = (
  method: 'POST' | 'GET' | 'PATCH',
  { body, headers, searchParams }: {
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
) => {
  const url = new URL('http://localhost/api/practice-sessions');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const requestHeaders = new Headers(headers);
  if (body && !requestHeaders.has('content-type')) {
    requestHeaders.set('content-type', 'application/json');
  }

  return {
    method,
    headers: requestHeaders,
    json: async () => {
      if (requestHeaders.get('content-type')?.includes('application/json')) {
        if (typeof body !== 'undefined') return Promise.resolve(body);
        throw new Error('Invalid JSON');
      }
      throw new Error('Not a JSON request');
    },
    nextUrl: { searchParams: url.searchParams },
  } as unknown as NextRequest;
};

const MOCK_USER_ID = 'user_123';

// Define the QuestionType union based on the schema's pgEnum
type MockQuestionType = 'MultipleChoice' | 'Matching' | 'MultipleCorrectStatements' | 'AssertionReason' | 'DiagramBased' | 'SequenceOrdering';

describe('/api/practice-sessions', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ userId: MOCK_USER_ID } as any);
    vi.mocked(applyRateLimit).mockResolvedValue(null);
    // Default mock for selectFromWhereMock removed to allow for more flexible test-specific mocks.
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- POST /api/practice-sessions ---
  describe('POST', () => {
    const validSessionData = { subject_id: 1, session_type: 'Practice' as const, question_count: 10 };
    const mockSessionResult = {
      sessionId: 1,
      questions: [{
        question_id: 1,
        question_text: 'Mock Question 1',
        question_type: 'MultipleChoice' as MockQuestionType,
        details: {},
        explanation: 'Mock Explanation',
        difficulty_level: 'easy',
        marks: 4,
        negative_marks: 1,
        topic_id: 1, topic_name: 'Mock Topic', subtopic_id: null, subtopic_name: null, source_type: 'AI_Generated'
      }],
      idempotencyKey: 'mock-key'
    };

    const { idempotencyKey, ...expectedResponse } = mockSessionResult;

    test('should create a session with a JSON body', async () => {
      const req = createMockRequest('POST', { body: validSessionData });
      vi.mocked(practiceSessionManager.createSession).mockResolvedValue(mockSessionResult);

      await POST(req);

      expect(practiceSessionManager.createSession).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    test('should create a session with query parameters', async () => {
      const req = createMockRequest('POST', {
        headers: { 'content-type': 'text/plain' },
        searchParams: { subject_id: '1', session_type: 'Test', topic_id: '2', subtopic_id: '3', duration_minutes: '15' },
      });
      vi.mocked(practiceSessionManager.createSession).mockResolvedValue(mockSessionResult);

      await POST(req);

      expect(practiceSessionManager.createSession).toHaveBeenCalledWith(expect.objectContaining({
        subjectId: 1, topicId: 2, subtopicId: 3, sessionType: 'Test'
      }), undefined);
      expect(NextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    test('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      const req = createMockRequest('POST', { body: validSessionData });
      await POST(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
    });

    test('should return rate limit response if hit', async () => {
      const rateLimitResp = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      vi.mocked(applyRateLimit).mockResolvedValue(rateLimitResp);
      const req = createMockRequest('POST', { body: validSessionData });
      const result = await POST(req);
      expect(result).toBe(rateLimitResp);
    });

    test('should return 400 for invalid request data', async () => {
      const req = createMockRequest('POST', { body: 'invalid-json' });
      vi.spyOn(req, 'json').mockRejectedValueOnce(new Error('Parse error'));
      await POST(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid request data' }, { status: 400 });
    });

    test('should return 400 for Zod validation errors', async () => {
      const req = createMockRequest('POST', { body: { subject_id: 'abc' } });
      await POST(req);
      expect(NextResponse.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid session parameters' }), { status: 400 });
    });

    test('should return 403 for subscription limit errors', async () => {
      vi.mocked(practiceSessionManager.createSession).mockRejectedValue(new Error('upgrade to premium'));
      const req = createMockRequest('POST', { body: validSessionData });
      await POST(req);
      expect(NextResponse.json).toHaveBeenCalledWith(expect.objectContaining({ upgradeRequired: true }), { status: 403 });
    });

    test('should return 409 for database constraint violations', async () => {
      vi.mocked(practiceSessionManager.createSession).mockRejectedValue(new Error('violates unique constraint "23505"'));
      const req = createMockRequest('POST', { body: validSessionData });
      await POST(req);
      expect(NextResponse.json).toHaveBeenCalledWith(expect.any(Object), { status: 409 });
    });

    test('should return 500 for unexpected errors during session creation', async () => {
      vi.mocked(practiceSessionManager.createSession).mockRejectedValue(new Error('Unexpected error'));
      const req = createMockRequest('POST', { body: validSessionData });
      await POST(req);
      expect(NextResponse.json).toHaveBeenCalledWith(expect.any(Object), { status: 500 });
    });

    test('should return 500 for top-level errors', async () => {
      vi.mocked(auth).mockRejectedValue(new Error('Clerk error'));
      const req = createMockRequest('POST', { body: validSessionData });
      await POST(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Failed to create practice session' }, { status: 500 });
    });
  });

  // --- GET /api/practice-sessions ---
  describe('GET', () => {
    const mockSessions = [{ session_id: 1, subject_name: 'Physics' }];
    const mockPaginatedResponse = { sessions: mockSessions, pagination: { total: 1, limit: 10, offset: 0 } };

    test('should return sessions from cache if available', async () => {
      vi.mocked(cache.get).mockResolvedValue(mockPaginatedResponse);
      const req = createMockRequest('GET');
      await GET(req);
      expect(cache.get).toHaveBeenCalled();
      expect(db.select).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith({ ...mockPaginatedResponse, source: 'cache' });
    });

    test('should fetch sessions from DB if cache is empty', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      selectFromWhereMock
        .mockReturnValueOnce({ orderBy: selectFromWhereOrderByMock }) // For sessions query
        .mockResolvedValueOnce([{ count: 1 }]); // For count query

      selectFromWhereOrderByLimitOffsetMock.mockResolvedValue(mockSessions);

      const req = createMockRequest('GET');
      await GET(req);

      expect(db.select).toHaveBeenCalledTimes(2);
      expect(cache.set).toHaveBeenCalled();
      expect(cacheService.trackCacheKey).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(expect.objectContaining({ source: 'database' }));
    });

    test('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      const req = createMockRequest('GET');
      await GET(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
    });

    test('should return rate limit response if hit', async () => {
      const rateLimitResp = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      vi.mocked(applyRateLimit).mockResolvedValue(rateLimitResp);
      const req = createMockRequest('GET');
      const result = await GET(req);
      expect(result).toBe(rateLimitResp);
    });

    test('should return stale cache on DB error', async () => {
      vi.mocked(cache.get).mockResolvedValueOnce(null).mockResolvedValueOnce(mockPaginatedResponse);
      selectFromWhereMock.mockReturnValue({ orderBy: selectFromWhereOrderByMock });
      selectFromWhereOrderByLimitOffsetMock.mockRejectedValue(new Error('DB down'));

      const req = createMockRequest('GET');
      await GET(req);

      expect(logger.error).toHaveBeenCalledWith('Database error fetching practice sessions', expect.any(Object));
      expect(NextResponse.json).toHaveBeenCalledWith(expect.objectContaining({ source: 'stale_cache' }), { status: 503 });
    });

    test('should return 500 on DB error with no stale cache', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      selectFromWhereMock.mockReturnValue({ orderBy: selectFromWhereOrderByMock });
      selectFromWhereOrderByLimitOffsetMock.mockRejectedValue(new Error('DB down'));

      const req = createMockRequest('GET');
      await GET(req);

      expect(NextResponse.json).toHaveBeenCalledWith(expect.any(Object), { status: 500 });
    });

    test('should correctly map session data, handling nulls', async () => {
      const dbResult = [{
        session_id: 1, session_type: 'Test', start_time: new Date(), end_time: null,
        duration_minutes: null, total_questions: 20, questions_attempted: null,
        questions_correct: null, score: null, max_score: null, is_completed: null,
        subject_name: 'Chemistry', topic_name: null
      }];
      const expectedMapped = {
        session_id: 1, session_type: 'Test', start_time: expect.any(Date), end_time: undefined,
        duration_minutes: undefined, total_questions: 20, questions_attempted: 0,
        questions_correct: 0, score: undefined, max_score: undefined, is_completed: false,
        subject_name: 'Chemistry', topic_name: undefined
      };

      vi.mocked(cache.get).mockResolvedValue(null);
      selectFromWhereMock
        .mockReturnValueOnce({ orderBy: selectFromWhereOrderByMock }) // For sessions query
        .mockResolvedValueOnce([{ count: 1 }]); // For count query
      selectFromWhereOrderByLimitOffsetMock.mockResolvedValue(dbResult);

      const req = createMockRequest('GET');
      await GET(req);

      const responseBody = vi.mocked(NextResponse.json).mock.calls[0][0] as any;
      expect(responseBody.sessions[0]).toEqual(expectedMapped);
    });
  });

  // --- PATCH /api/practice-sessions ---
  describe('PATCH', () => {
    const validUpdateData = { sessionId: 1, isCompleted: true, score: 80 };

    test('should successfully update a session', async () => {
      const req = createMockRequest('PATCH', { body: validUpdateData });
      selectFromWhereMock.mockReturnValue({ limit: selectFromWhereLimitMock });
      selectFromWhereLimitMock.mockResolvedValue([{ session_id: 1 }]); // Ownership check
      updateSetWhereMock.mockResolvedValue(undefined);

      await PATCH(req);

      expect(db.update).toHaveBeenCalled();
      expect(updateSetMock).toHaveBeenCalledWith(expect.objectContaining({
        is_completed: true,
        end_time: expect.any(Date)
      }));
      expect(cacheService.invalidateUserSessionCaches).toHaveBeenCalledWith(MOCK_USER_ID, 1);
      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    });

    test('should not set end_time if isCompleted is not true', async () => {
      const req = createMockRequest('PATCH', { body: { sessionId: 1, score: 50 } });
      selectFromWhereMock.mockReturnValue({ limit: selectFromWhereLimitMock });
      selectFromWhereLimitMock.mockResolvedValue([{ session_id: 1 }]);
      updateSetWhereMock.mockResolvedValue(undefined);

      await PATCH(req);

      expect(updateSetMock).toHaveBeenCalledWith(expect.objectContaining({
        end_time: undefined
      }));
    });

    test('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      const req = createMockRequest('PATCH', { body: validUpdateData });
      await PATCH(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
    });

    test('should return rate limit response if hit', async () => {
      const rateLimitResp = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      vi.mocked(applyRateLimit).mockResolvedValue(rateLimitResp);
      const req = createMockRequest('PATCH', { body: validUpdateData });
      const result = await PATCH(req);
      expect(result).toBe(rateLimitResp);
    });

    test('should return 400 for invalid JSON body', async () => {
      const req = createMockRequest('PATCH', { body: 'invalid' });
      vi.spyOn(req, 'json').mockRejectedValueOnce(new Error());
      await PATCH(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid JSON in request body' }, { status: 400 });
    });

    test('should return 400 for Zod validation errors', async () => {
      const req = createMockRequest('PATCH', { body: { sessionId: 'abc' } });
      await PATCH(req);
      expect(NextResponse.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid session update parameters' }), { status: 400 });
    });

    test('should return 404 if session not found or not owned by user', async () => {
      selectFromWhereMock.mockReturnValue({ limit: selectFromWhereLimitMock });
      selectFromWhereLimitMock.mockResolvedValue([]); // Ownership check fails
      const req = createMockRequest('PATCH', { body: validUpdateData });
      await PATCH(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Session not found or unauthorized' }, { status: 404 });
    });

    test('should return 500 on unexpected update error', async () => {
      selectFromWhereMock.mockReturnValue({ limit: selectFromWhereLimitMock });
      selectFromWhereLimitMock.mockResolvedValue([{ session_id: 1 }]);
      updateSetWhereMock.mockRejectedValue(new Error('DB update failed'));
      const req = createMockRequest('PATCH', { body: validUpdateData });
      await PATCH(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Failed to update practice session' }, { status: 500 });
    });

    test('should return 500 on unexpected validation error', async () => {
      const req = createMockRequest('PATCH', { body: validUpdateData });
      vi.spyOn(z.ZodObject.prototype, 'parse').mockImplementationOnce(() => {
        throw new Error('Unexpected validation lib error');
      });
      await PATCH(req);
      expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Failed to update practice session' }, { status: 500 });
    });
  });
});