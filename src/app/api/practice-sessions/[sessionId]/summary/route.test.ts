
// src/app/api/practice-sessions/[sessionId]/summary/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';
import { applyRateLimit } from '@/lib/middleware/rateLimitMiddleware';
import { updateSessionStats } from '@/lib/utilities/sessionUtils';

// Global vi from vitest globals configuration
declare global {
  const vi: typeof import('vitest').vi;
}

vi.mock('@/db', async () => {
  const actualDrizzle = await vi.importActual('drizzle-orm');
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    })),
  };
  return {
    db: mockDb,
    practice_sessions: {},
    session_questions: {},
    question_attempts: {},
    questions: {},
    topics: {},
    ...actualDrizzle,
  };
});

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/lib/middleware/rateLimitMiddleware', () => ({
  applyRateLimit: vi.fn(),
  RATE_LIMITS: {
    GET_SESSION_SUMMARY: {
      requests: 10,
      window: 60,
    },
  },
  CACHE_TTLS: {
    SESSION_SUMMARY_CACHE: 3600,
  }
}));

vi.mock('@/lib/services/CacheService', () => ({
  cacheService: {
    trackCacheKey: vi.fn(),
  }
}));

vi.mock('@/lib/utilities/sessionUtils', () => ({
  updateSessionStats: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('GET /api/practice-sessions/[sessionId]/summary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: null });
    const request = new NextRequest('http://localhost/api/practice-sessions/1/summary');
    const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 400 if sessionId is invalid', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: 'user_123' });
    const request = new NextRequest('http://localhost/api/practice-sessions/invalid/summary');
    const response = await GET(request, { params: Promise.resolve({ sessionId: 'invalid' }) });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid session ID');
  });

  it('should return 429 if rate limit is exceeded', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: 'user_123' });
    const rateLimitResponse = new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
    (applyRateLimit as vi.Mock).mockResolvedValue(rateLimitResponse);
    const request = new NextRequest('http://localhost/api/practice-sessions/1/summary');
    const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });
    expect(response.status).toBe(429);
  });

  it('should return cached summary if available', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: 'user_123' });
    const cachedSummary = { sessionId: 1, totalQuestions: 10, source: 'cache' };
    (cache.get as vi.Mock).mockResolvedValue(cachedSummary);
    const request = new NextRequest('http://localhost/api/practice-sessions/1/summary');
    const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ...cachedSummary, source: 'cache' });
  });

  it('should return 404 if session is not found', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: 'user_123' });
    (cache.get as vi.Mock).mockResolvedValue(null);
    (applyRateLimit as vi.Mock).mockResolvedValue(null);
    (updateSessionStats as vi.Mock).mockResolvedValue(undefined);
    
    // Mock the session query to return empty array
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }));
    
    const request = new NextRequest('http://localhost/api/practice-sessions/1/summary');
    const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });
    expect(response.status).toBe(404);
  });

  it('should return 500 on unexpected error', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: 'user_123' });
    (cache.get as vi.Mock).mockRejectedValue(new Error('Unexpected error'));
    const request = new NextRequest('http://localhost/api/practice-sessions/1/summary');
    const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });
    expect(response.status).toBe(500);
  });

  it('should successfully generate a session summary', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: 'user_123' });
    (cache.get as vi.Mock).mockResolvedValue(null);
    (applyRateLimit as vi.Mock).mockResolvedValue(null);
    (updateSessionStats as vi.Mock).mockResolvedValue(undefined);

    const sessionData = {
      session_id: 1,
      user_id: 'user_123',
      total_questions: 2,
      questions_attempted: 2,
      questions_correct: 1,
      duration_minutes: 10,
      score: 5,
      max_score: 10,
      is_completed: false,
      end_time: null,
    };

    const sessionQuestionData = [
      {
        questionId: 1,
        topicId: 1,
        topicName: 'Topic 1',
        isCorrect: true,
        marksAwarded: 5,
        marksPossible: 5,
        timeTaken: 30,
      },
      {
        questionId: 2,
        topicId: 1,
        topicName: 'Topic 1',
        isCorrect: false,
        marksAwarded: 0,
        marksPossible: 5,
        timeTaken: 20,
      },
    ];

    // Mock the first db.select call for sessionData
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([sessionData]),
    }));

    // Mock the second db.select call for sessionQuestionData
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(sessionQuestionData),
    }));

    // Mock db.update
    (db.update as vi.Mock).mockImplementationOnce(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    }));

    const request = new NextRequest('http://localhost/api/practice-sessions/1/summary');
    const response = await GET(request, { params: Promise.resolve({ sessionId: '1' }) });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.sessionId).toBe(1);
    expect(body.totalQuestions).toBe(2);
    expect(body.questionsCorrect).toBe(1);
    expect(body.accuracy).toBe(50);
    expect(body.topicPerformance[0].topicName).toBe('Topic 1');
    expect(db.update).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalled();
  });
});
