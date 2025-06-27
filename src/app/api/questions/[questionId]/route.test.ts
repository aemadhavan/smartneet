// src/app/api/questions/[questionId]/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
  questions: {},
  topics: {},
  subtopics: {},
  subjects: {},
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Import mocks for typing and control
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { cache } from '@/lib/cache';

const mockedAuth = auth as vi.Mock;
const mockedDb = db as any;
const mockedCacheGet = cache.get as vi.Mock;
const mockedCacheSet = cache.set as vi.Mock;

describe('GET /api/questions/[questionId]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const createMockRequest = () => {
    return {} as NextRequest;
  };

  it('should return 401 if user is not authenticated', async () => {
    mockedAuth.mockResolvedValue({ userId: null });
    const req = createMockRequest();
    const params = { params: Promise.resolve({ questionId: '1' }) };

    const response = await GET(req, params);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 if questionId is missing', async () => {
    mockedAuth.mockResolvedValue({ userId: 'user_123' });
    const req = createMockRequest();
    const params = { params: Promise.resolve({ questionId: '' }) };

    const response = await GET(req, params);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: 'Missing question ID' });
  });

  it('should return 400 if questionId is not a number', async () => {
    mockedAuth.mockResolvedValue({ userId: 'user_123' });
    const req = createMockRequest();
    const params = { params: Promise.resolve({ questionId: 'abc' }) };

    const response = await GET(req, params);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: 'Invalid question ID' });
  });

  it('should return question from cache if available', async () => {
    mockedAuth.mockResolvedValue({ userId: 'user_123' });
    const cachedQuestion = { question_id: 1, question_text: 'Cached question' };
    mockedCacheGet.mockResolvedValue(cachedQuestion);

    const req = createMockRequest();
    const params = { params: Promise.resolve({ questionId: '1' }) };
    const response = await GET(req, params);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ...cachedQuestion, source: 'cache' });
    expect(mockedCacheGet).toHaveBeenCalledWith('question:1');
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it('should fetch question from DB if not in cache', async () => {
    mockedAuth.mockResolvedValue({ userId: 'user_123' });
    mockedCacheGet.mockResolvedValue(null);
    const dbQuestion = { question_id: 1, question_text: 'DB question' };

    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([dbQuestion]),
    });

    const req = createMockRequest();
    const params = { params: Promise.resolve({ questionId: '1' }) };
    const response = await GET(req, params);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ...dbQuestion, source: 'database' });
    expect(mockedCacheGet).toHaveBeenCalledWith('question:1');
    expect(mockedCacheSet).toHaveBeenCalledWith('question:1', dbQuestion, 3600);
  });

  it('should return 404 if question not found in DB', async () => {
    mockedAuth.mockResolvedValue({ userId: 'user_123' });
    mockedCacheGet.mockResolvedValue(null);

    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    });

    const req = createMockRequest();
    const params = { params: Promise.resolve({ questionId: '1' }) };
    const response = await GET(req, params);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: 'Question not found' });
  });

  it('should return 500 if there is a general error', async () => {
    const error = new Error('Something went wrong');
    mockedAuth.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = createMockRequest();
    const params = { params: Promise.resolve({ questionId: '1' }) };
    const response = await GET(req, params);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Failed to fetch question details' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching question:', error);

    consoleErrorSpy.mockRestore();
  });
});