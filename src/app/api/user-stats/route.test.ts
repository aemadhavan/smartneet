// src/app/api/user-stats/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { GET } from './route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
  practice_sessions: {},
  topic_mastery: {},
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

const mockedAuth = auth as unknown as Mock;
const mockedDb = db as any;
const mockedCacheGet = cache.get as unknown as Mock;
const mockedCacheSet = cache.set as unknown as Mock;

describe('GET /api/user-stats', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers(); // Use fake timers to control setTimeout
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers
  });

  it('should return 401 if user is not authenticated', async () => {
    mockedAuth.mockResolvedValue({ userId: null });

    const response = await GET();

    expect(response.status).toBe(401);
    const text = await response.text();
    expect(text).toBe('Unauthorized');
  });

  it('should return stats from cache if available', async () => {
    const userId = 'user_123';
    const cachedStats = { totalSessions: 10, source: 'cache' };
    mockedAuth.mockResolvedValue({ userId });
    mockedCacheGet.mockResolvedValue(cachedStats);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(cachedStats);
    expect(mockedCacheGet).toHaveBeenCalledWith(`user:${userId}:stats`);
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it('should fetch stats from DB, cache them, and return them if not in cache', async () => {
    const userId = 'user_123';
    mockedAuth.mockResolvedValue({ userId });
    mockedCacheGet.mockResolvedValue(null);

    // Mock DB responses
    const sessionsResult = [{ count: 20 }];
    const questionsResult = [{
      attempted: '150',
      correct: '120',
      duration: '300'
    }];
    const masteredResult = [{ count: 5 }];
    const yesterdayActivityResult = [{ count: 1 }];

    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn()
        .mockResolvedValueOnce(sessionsResult)
        .mockResolvedValueOnce(questionsResult)
        .mockResolvedValueOnce(masteredResult)
        .mockResolvedValueOnce(yesterdayActivityResult),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      totalSessions: 20,
      totalQuestionsAttempted: 150,
      totalCorrectAnswers: 120,
      averageAccuracy: 80,
      totalDurationMinutes: 300,
      streakCount: 4, // Based on yesterday's activity
      masteredTopics: 5,
      source: 'database',
    });

    expect(mockedCacheGet).toHaveBeenCalledWith(`user:${userId}:stats`);
    expect(mockedCacheSet).toHaveBeenCalledWith(
      `user:${userId}:stats`,
      expect.any(Object),
      900
    );
  });

  it('should handle zero questions attempted gracefully', async () => {
    const userId = 'user_123';
    mockedAuth.mockResolvedValue({ userId });
    mockedCacheGet.mockResolvedValue(null);

    const sessionsResult = [{ count: 0 }];
    const questionsResult = [{ attempted: '0', correct: '0', duration: '0' }];
    const masteredResult = [{ count: 0 }];
    const yesterdayActivityResult = [{ count: 0 }];

    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn()
        .mockResolvedValueOnce(sessionsResult)
        .mockResolvedValueOnce(questionsResult)
        .mockResolvedValueOnce(masteredResult)
        .mockResolvedValueOnce(yesterdayActivityResult),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.averageAccuracy).toBe(0);
    expect(json.streakCount).toBe(0);
  });

  it('should return 500 if auth fails', async () => {
    const error = new Error('Auth error');
    mockedAuth.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toBe('Internal Server Error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user stats:', error);

    consoleErrorSpy.mockRestore();
  });

  it('should return 500 if a database query times out', async () => {
    const userId = 'user_123';
    mockedAuth.mockResolvedValue({ userId });
    mockedCacheGet.mockResolvedValue(null);

    const timeoutError = new Error('Query timeout');
    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnValue(new Promise((_, reject) => {
        setTimeout(() => reject(timeoutError), 100);
      })),
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const promise = GET();
    await vi.advanceTimersByTimeAsync(100);
    const response = await promise;

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toBe('Internal Server Error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user stats:', timeoutError);

    consoleErrorSpy.mockRestore();
  });
});
