// src/app/api/session-questions/lookup/route.test.ts
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { db } from '@/db';
import { session_questions } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { applyRateLimit, RATE_LIMITS, CACHE_TTLS } from '@/lib/middleware/rateLimitMiddleware';
import { cache } from '@/lib/cache';

// Mock external modules
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  session_questions: {},
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/middleware/rateLimitMiddleware', () => ({
  applyRateLimit: vi.fn(),
  RATE_LIMITS: {
    SESSION_QUESTION_LOOKUP: { requests: 10, window: 60 },
  },
  CACHE_TTLS: {
    SESSION_QUESTION_LOOKUP: 3600,
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('GET /api/session-questions/lookup', () => {
  const userId = 'user_123';
  const sessionId = 1;
  const questionId = 101;
  const sessionQuestionId = 5001;

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as vi.Mock).mockResolvedValue({ userId });
    (applyRateLimit as vi.Mock).mockResolvedValue(null); // No rate limit by default
    (cache.get as vi.Mock).mockResolvedValue(null); // Cache miss by default
    (db.select as vi.Mock).mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]), // Default to not found
    }));
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: null });
    const request = new NextRequest('http://localhost/api/session-questions/lookup');
    const response = await GET(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return rate limit response if exceeded', async () => {
    const rateLimitResponse = new NextResponse(JSON.stringify({ error: 'Too many requests' }), { status: 429, statusText: 'Too many requests' });
    (applyRateLimit as vi.Mock).mockResolvedValue(rateLimitResponse);

    const request = new NextRequest('http://localhost/api/session-questions/lookup');
    const response = await GET(request);
    expect(response.status).toBe(429);
    expect(response.statusText).toBe('Too many requests');
  });

  it('should return 400 if session_id is missing or invalid', async () => {
    const request = new NextRequest(`http://localhost/api/session-questions/lookup?question_id=${questionId}`);
    const response = await GET(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details.session_id).toContain('session_id must be a number');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should return 400 if question_id is missing or invalid', async () => {
    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}`);
    const response = await GET(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details.question_id).toContain('question_id must be a number');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should return cached data if available', async () => {
    const mockCachedResult = { session_question_id: sessionQuestionId };
    (cache.get as vi.Mock).mockResolvedValue(mockCachedResult);

    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}&question_id=${questionId}`);
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockCachedResult);
    expect(cache.get).toHaveBeenCalledWith(`session:${userId}:${sessionId}:question:${questionId}:lookup`);
    expect(db.select).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('Cache hit for session question lookup', expect.any(Object));
  });

  it('should return 404 if session question not found in DB', async () => {
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]), // Not found
    }));

    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}&question_id=${questionId}`);
    const response = await GET(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Session question not found for this user');
    expect(logger.warn).toHaveBeenCalledWith('Session question not found', expect.any(Object));
  });

  it('should fetch from DB, return data, and cache it', async () => {
    const mockDbResult = [{ session_question_id: sessionQuestionId }];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockDbResult),
    }));

    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}&question_id=${questionId}`);
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ session_question_id: sessionQuestionId });
    expect(cache.set).toHaveBeenCalledWith(
      `session:${userId}:${sessionId}:question:${questionId}:lookup`,
      { session_question_id: sessionQuestionId },
      CACHE_TTLS.SESSION_QUESTION_LOOKUP
    );
    expect(logger.debug).toHaveBeenCalledWith('Successfully looked up session question', expect.any(Object));
  });

  it('should return 500 for unexpected errors during DB query', async () => {
    (db.select as vi.Mock).mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}&question_id=${questionId}`);
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('An unexpected error occurred while looking up the session question.');
    expect(logger.error).toHaveBeenCalledWith('Error looking up session questions', expect.any(Object));
  });

  it('should handle ZodError thrown in catch block (non-safeParse scenario)', async () => {
    // Mock the z module to throw a ZodError after safeParse
    const { z } = await import('zod');
    const originalSafeParse = z.ZodSchema.prototype.safeParse;
    
    // Mock safeParse to return success but then have something throw a ZodError later
    vi.spyOn(z.ZodSchema.prototype, 'safeParse').mockReturnValueOnce({ 
      success: true, 
      data: { session_id: sessionId, question_id: questionId } 
    });
    
    // Make cache.get throw a ZodError to trigger the catch block
    const zodError = new z.ZodError([{
      code: 'invalid_type',
      expected: 'string',
      received: 'number',
      path: ['test_field'],
      message: 'Expected string, received number'
    }]);
    
    (cache.get as vi.Mock).mockRejectedValueOnce(zodError);

    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}&question_id=${questionId}`);
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
    
    // Restore the original safeParse
    z.ZodSchema.prototype.safeParse = originalSafeParse;
  });

  it('should handle cache errors gracefully', async () => {
    // Make cache.get throw a non-Zod error
    (cache.get as vi.Mock).mockRejectedValueOnce(new Error('Cache connection failed'));
    
    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}&question_id=${questionId}`);
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('An unexpected error occurred while looking up the session question.');
    expect(logger.error).toHaveBeenCalledWith('Error looking up session questions', expect.any(Object));
  });

  it('should handle cache set errors gracefully', async () => {
    const mockDbResult = [{ session_question_id: sessionQuestionId }];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockDbResult),
    }));
    
    // Make cache.set throw an error
    (cache.set as vi.Mock).mockRejectedValueOnce(new Error('Cache write failed'));

    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}&question_id=${questionId}`);
    const response = await GET(request);
    
    // Should still return success even if cache fails
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ session_question_id: sessionQuestionId });
    expect(logger.warn).toHaveBeenCalledWith('Failed to cache session question lookup result', expect.any(Object));
  });

  it('should handle non-Error cache set failures', async () => {
    const mockDbResult = [{ session_question_id: sessionQuestionId }];
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockDbResult),
    }));
    
    // Make cache.set throw a non-Error value
    (cache.set as vi.Mock).mockRejectedValueOnce('Cache write failed - string error');

    const request = new NextRequest(`http://localhost/api/session-questions/lookup?session_id=${sessionId}&question_id=${questionId}`);
    const response = await GET(request);
    
    // Should still return success even if cache fails
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ session_question_id: sessionQuestionId });
    expect(logger.warn).toHaveBeenCalledWith('Failed to cache session question lookup result', expect.objectContaining({
      error: 'Cache write failed - string error'
    }));
  });
});
