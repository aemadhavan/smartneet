// src/app/api/question-types/route.test.ts
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';
import { question_attempts, questions } from '@/db/schema';
import { count, eq } from 'drizzle-orm';

// Mock external modules
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    groupBy: vi.fn(),
    limit: vi.fn(),
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  question_attempts: {},
  questions: {},
}));

// Mock console.error to prevent noise during tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/question-types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations for db methods to allow chaining
    (db.select as vi.Mock).mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // Default to empty array
    }));
    (cache.get as vi.Mock).mockResolvedValue(null); // Default to cache miss
    (cache.set as vi.Mock).mockResolvedValue(undefined);
    (auth as vi.Mock).mockResolvedValue({ userId: 'user_123' }); // Default authenticated user
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return 401 if user is not authenticated', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: null });
    const response = await GET();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return cached data if available', async () => {
    const mockCachedData = [
      { name: 'Multiple Choice', value: 100 },
      { name: 'True/False', value: 50 },
    ];
    (cache.get as vi.Mock).mockResolvedValue(mockCachedData);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(mockCachedData);
    expect(body.source).toBe('cache');
    expect(cache.get).toHaveBeenCalledWith('user:user_123:question-type-distribution');
    expect(db.select).not.toHaveBeenCalled(); // Should not hit DB if cached
  });

  it('should fetch from database and return formatted data', async () => {
    const mockDbData = [
      { question_type: 'multiple_choice', count: 10 },
      { question_type: 'multiple_correct_statements', count: 5 },
    ];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockDbData),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([
      { name: 'Multiple Choice', value: 10 },
      { name: 'Multiple Correct Statements', value: 5 },
    ]);
    expect(body.source).toBe('database');
    expect(cache.set).toHaveBeenCalledWith(
      'user:user_123:question-type-distribution',
      expect.any(Array),
      3600
    );
  });

  it('should return default data if database returns no attempts', async () => {
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No data from DB
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([
      { name: 'Multiple Choice', value: 65 },
      { name: 'Multiple Correct Statements', value: 15 },
      { name: 'Assertion Reason', value: 10 },
      { name: 'Matching', value: 5 },
      { name: 'Sequence Ordering', value: 5 },
    ]);
    expect(body.source).toBe('default_cached');
    expect(cache.set).toHaveBeenCalledWith(
      'user:user_123:question-type-distribution',
      expect.any(Array),
      3600
    );
  });

  it('should handle database query timeout', async () => {
    // Mock Promise.race to simulate a timeout
    vi.spyOn(Promise, 'race').mockImplementationOnce(() => {
      return Promise.reject(new Error('Query timeout'));
    });

    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to fetch question type distribution');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching question type distribution:',
      expect.any(Error)
    );
  });

  it('should handle generic errors during database query', async () => {
    (db.select as vi.Mock).mockImplementationOnce(() => {
      throw new Error('DB connection error');
    });

    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to fetch question type distribution');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching question type distribution:',
      expect.any(Error)
    );
  });

  it('should handle cache set errors gracefully', async () => {
    const mockDbData = [
      { question_type: 'multiple_choice', count: 10 },
    ];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockDbData),
    }));
    (cache.set as vi.Mock).mockRejectedValue(new Error('Cache write error'));

    const response = await GET();
    expect(response.status).toBe(200); // Still returns 200 even with cache error
    const body = await response.json();
    expect(body.data).toEqual([
      { name: 'Multiple Choice', value: 10 },
    ]);
    expect(body.source).toBe('database');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error setting cache for question type distribution:',
      expect.any(Error)
    ); // Cache error is logged separately
  });

  it('should handle cache get errors gracefully', async () => {
    (cache.get as vi.Mock).mockRejectedValue(new Error('Cache read error'));
    const mockDbData = [
      { question_type: 'multiple_choice', count: 15 },
    ];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockDbData),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([
      { name: 'Multiple Choice', value: 15 },
    ]);
    expect(body.source).toBe('database');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error getting cache for question type distribution:',
      expect.any(Error)
    ); // Cache get error is logged separately
  });

  it('should handle different question type formats', async () => {
    const mockDbData = [
      { question_type: 'assertion_reason', count: 8 },
      { question_type: 'sequence_ordering', count: 3 },
      { question_type: 'matching', count: 12 },
    ];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockDbData),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([
      { name: 'Assertion Reason', value: 8 },
      { name: 'Sequence Ordering', value: 3 },
      { name: 'Matching', value: 12 },
    ]);
    expect(body.source).toBe('database');
  });

  it('should handle single word question types', async () => {
    const mockDbData = [
      { question_type: 'essay', count: 5 },
      { question_type: 'calculation', count: 7 },
    ];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockDbData),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([
      { name: 'Essay', value: 5 },
      { name: 'Calculation', value: 7 },
    ]);
    expect(body.source).toBe('database');
  });

  it('should convert count to number even if it comes as string', async () => {
    const mockDbData = [
      { question_type: 'multiple_choice', count: '20' }, // String count
    ];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockDbData),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([
      { name: 'Multiple Choice', value: 20 }, // Should be converted to number
    ]);
    expect(typeof body.data[0].value).toBe('number');
  });
});
