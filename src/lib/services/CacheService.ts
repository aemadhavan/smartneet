// src/lib/services/CacheService.ts
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

export class CacheService {
  /**
   * Invalidate all session cache entries for a user with more targeted approach
   * @param userId User ID
   * @param sessionId Optional session ID for more targeted invalidation
   */
  async invalidateUserSessionCaches(userId: string, sessionId?: number): Promise<void> {
    try {
      // Track invalidation patterns
      const patterns: string[] = [];
      
      // Always invalidate these patterns
      patterns.push(`user:${userId}:subscription`);
      patterns.push(`user:${userId}:tests:*`);
      
      // If specific session, only invalidate that session
      if (sessionId) {
        patterns.push(`session:${userId}:${sessionId}`);
        patterns.push(`api:practice-sessions:${sessionId}:*`);
      } else {
        // Otherwise invalidate all sessions
        patterns.push(`session:${userId}:*`);
        patterns.push(`api:practice-sessions:user:${userId}:*`);
      }
      
      // Always clear idempotency keys
      patterns.push(`idempotency:${userId}:*`);
      
      // Delete each pattern individually with error handling
      const results: { pattern: string; count: number; error?: string }[] = [];
      
      for (const pattern of patterns) {
        try {
          const count = await cache.deletePattern(pattern);
          results.push({ pattern, count });
        } catch (patternError) {
          results.push({ 
            pattern, 
            count: 0, 
            error: patternError instanceof Error ? patternError.message : String(patternError) 
          });
        }
      }
      
      // Use revalidatePath for Next.js cache invalidation
      if (typeof revalidatePath === 'function') {
        revalidatePath('/dashboard');
        revalidatePath('/practice');
        revalidatePath('/sessions');
        if (sessionId) {
          revalidatePath(`/sessions/${sessionId}`);
          revalidatePath(`/practice-sessions/${sessionId}`);
        }
      }
      
      logger.info('Cache invalidation completed', {
        userId,
        context: 'CacheService.invalidateUserSessionCaches',
        data: { sessionId, results }
      });
    } catch (error) {
      logger.error('Error invalidating session cache', {
        context: 'CacheService.invalidateUserSessionCaches',
        data: { sessionId },
        error: error instanceof Error ? error : String(error)
      });
    }
  }
  
  /**
   * Track a cache key for later invalidation
   * @param userId User ID
   * @param cacheKey Cache key to track
   */
  async trackCacheKey(userId: string, cacheKey: string): Promise<void> {
    try {
      const userKeysSetKey = `user:${userId}:cache-keys`;
      await cache.trackKey(userId, cacheKey);
      
      logger.debug('Tracked cache key', {
        userId,
        context: 'CacheService.trackCacheKey',
        data: { cacheKey, userKeysSetKey }
      });
    } catch (error) {
      logger.error('Error tracking cache key', {
        userId,
        context: 'CacheService.trackCacheKey',
        data: { cacheKey },
        error: error instanceof Error ? error : String(error)
      });
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();