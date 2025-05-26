// src/lib/middleware/rateLimitMiddleware.ts
import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';

// Define rate limit configurations - centralized
export const RATE_LIMITS = {
  CREATE_SESSION: { points: 20, duration: 60 * 60 }, // 20 requests per hour
  GET_SESSIONS: { points: 120, duration: 60 }, // 120 requests per minute
  UPDATE_SESSION: { points: 60, duration: 60 }, // 60 requests per minute
  DELETE_SESSION: { points: 10, duration: 60 * 60 }, // 10 requests per hour
  GET_SESSION_DETAIL: { points: 150, duration: 60 }, // 150 requests per minute
  UPDATE_SESSION_DETAIL: { points: 60, duration: 60 }, // 60 requests per minute
  GET_SESSION_REVIEW: { points: 120, duration: 60 }, // 120 requests per minute
  GET_SESSION_SUMMARY: { points: 120, duration: 60 }, // 120 requests per minute
  SUBMIT_SESSION_ANSWERS: { points: 60, duration: 60 }, // 60 requests per minute
  SESSION_QUESTION_LOOKUP: { points: 200, duration: 60 } // 200 requests per minute
};

// Cache TTL configurations - centralized
export const CACHE_TTLS = {
  IDEMPOTENCY_KEY: 3600, // 1 hour
  SESSION_CACHE: 300, // 5 minutes
  SESSION_DETAIL_CACHE: 600, // 10 minutes
  SESSION_REVIEW_CACHE: 1800, // 30 minutes
  SESSION_SUMMARY_CACHE: 3600, // 1 hour
  SESSION_QUESTION_LOOKUP: 3600, // 1 hour
  QUESTION_POOL: 3600, // 1 hour
  USER_KEYS: 86400 // 24 hours
};

/**
 * Middleware to apply rate limiting
 * @param userId User ID for rate limiting
 * @param actionKey Key identifying the action (e.g., 'create-session')
 * @param limits Rate limit configuration
 * @returns NextResponse with rate limit error or null to continue
 */
export async function applyRateLimit(
  userId: string,
  actionKey: string,
  limits: { points: number; duration: number }
): Promise<NextResponse | null> {
  try {
    const rateLimiter = new RateLimiter(
      `${actionKey}:${userId}`, 
      limits.points, 
      limits.duration
    );
    
    const rateLimitResult = await rateLimiter.consume();
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      );
    }
    
    return null; // No rate limit issue, continue
  } catch (error) {
    console.error(`Rate limit error for ${actionKey}:`, error);
    // If rate limiting fails, allow the request to proceed
    return null;
  }
}