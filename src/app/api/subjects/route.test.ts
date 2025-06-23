import { NextRequest, NextResponse } from 'next/server';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { GET } from './route';
import { db } from '@/db';
import { cache } from '@/lib/cache';
import { eq } from 'drizzle-orm';
import { subjects } from '@/db/schema';

// Mock dependencies
vi.mock('@/db/schema', () => ({
  subjects: {
    is_active: 'subjects.is_active_column', // Mock column object for assertion
  },
}));

// Mocks for Drizzle's fluent API
const fromMock = vi.fn();
const whereMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    // db.select() returns an object with a `from` method
    select: vi.fn(() => ({ from: fromMock })),
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => `eq(${field}, ${value})`),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

const createMockRequest = (searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/subjects');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return {
    nextUrl: {
      searchParams: url.searchParams,
    },
  } as NextRequest;
};

describe('GET /api/subjects', () => {
  const mockAllSubjects = [
    { id: 1, name: 'Physics', is_active: true },
    { id: 2, name: 'Chemistry', is_active: true },
    { id: 3, name: 'Archaic Studies', is_active: false },
  ];
  const mockActiveSubjects = mockAllSubjects.filter(s => s.is_active);

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console to avoid polluting test output and allow spying
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  test('should return all subjects from database when cache is empty', async () => {
    vi.mocked(cache.get).mockResolvedValue(null);
    // The `from` call is the end of the chain and returns the promise
    fromMock.mockResolvedValue(mockAllSubjects);

    const req = createMockRequest();
    await GET(req);

    expect(cache.get).toHaveBeenCalledWith('api:subjects:isActive:undefined');
    expect(db.select).toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledWith(subjects);
    expect(whereMock).not.toHaveBeenCalled(); // Check that the where clause was not part of the chain
    expect(cache.set).toHaveBeenCalledWith('api:subjects:isActive:undefined', mockAllSubjects, 3600);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: true, data: mockAllSubjects, source: 'database' },
      { status: 200 }
    );
  });

  test('should return active subjects from database when isActive=true and cache is empty', async () => {
    vi.mocked(cache.get).mockResolvedValue(null);
    // `from` returns an object with a `where` method for chaining
    fromMock.mockReturnValue({ where: whereMock });
    // `where` is the end of the chain and returns the promise
    whereMock.mockResolvedValue(mockActiveSubjects);

    const req = createMockRequest({ isActive: 'true' });
    await GET(req);

    expect(cache.get).toHaveBeenCalledWith('api:subjects:isActive:true');
    expect(db.select).toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledWith(subjects);
    expect(whereMock).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith(subjects.is_active, true);
    expect(cache.set).toHaveBeenCalledWith('api:subjects:isActive:true', mockActiveSubjects, 3600);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: true, data: mockActiveSubjects, source: 'database' },
      { status: 200 }
    );
  });

  test('should return subjects from cache when available', async () => {
    vi.mocked(cache.get).mockResolvedValue(mockActiveSubjects);

    const req = createMockRequest({ isActive: 'true' });
    await GET(req);

    expect(cache.get).toHaveBeenCalledWith('api:subjects:isActive:true');
    expect(db.select).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: true, data: mockActiveSubjects, source: 'cache' },
      { status: 200 }
    );
  });

  test('should retry database operation on failure and eventually succeed', async () => {
    vi.mocked(cache.get).mockResolvedValue(null);
    // This test path doesn't use `where`, so `from` is the promise
    fromMock
      .mockRejectedValueOnce(new Error('DB connection failed'))
      .mockResolvedValueOnce(mockAllSubjects);

    const req = createMockRequest();
    const getPromise = GET(req);

    // Let the first attempt fail and trigger the retry logic
    await vi.advanceTimersByTimeAsync(0);
    expect(console.log).toHaveBeenCalledWith('Database operation attempt 1 failed:', expect.any(Error));

    // Fast-forward timers to skip the delay and trigger the next attempt
    await vi.runAllTimersAsync();
    await getPromise;

    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: true, data: mockAllSubjects, source: 'database' },
      { status: 200 }
    );
  });

  test('should return stale cache as fallback when database fails repeatedly', async () => {
    const staleData = [{ id: 99, name: 'Old Subject', is_active: true }];
    vi.mocked(cache.get)
      .mockResolvedValueOnce(null) // First check fails
      .mockResolvedValueOnce(staleData); // Fallback check succeeds

    // This test path doesn't use `where`, so `from` is the promise
    fromMock.mockRejectedValue(new Error('DB connection failed permanently'));

    const req = createMockRequest();
    const getPromise = GET(req);

    await vi.runAllTimersAsync(); // Exhaust all retries
    await getPromise;

    expect(console.error).toHaveBeenCalledWith('Error fetching subjects:', expect.any(Error));
    expect(console.log).toHaveBeenCalledWith('Returning stale cache data as fallback');
    expect(cache.get).toHaveBeenCalledTimes(2);
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: true,
        data: staleData,
        source: 'fallback_cache',
        warning: 'Data may be stale due to connection issues',
      },
      { status: 200 }
    );
  });

  test('should return 503 error when database fails and no cache is available', async () => {
    vi.mocked(cache.get).mockResolvedValue(null); // Both primary and fallback checks fail
    // This test path doesn't use `where`, so `from` is the promise
    fromMock.mockRejectedValue(new Error('DB connection failed permanently'));

    const req = createMockRequest();
    const getPromise = GET(req);

    await vi.runAllTimersAsync(); // Exhaust all retries
    await getPromise;

    expect(console.error).toHaveBeenCalledWith('Error fetching subjects:', expect.any(Error));
    expect(cache.get).toHaveBeenCalledTimes(2);
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: 'Database connection failed',
        data: [],
        fallback: true,
      },
      { status: 503 }
    );
  });
});