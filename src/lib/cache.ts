// lib/cache.ts
import { Redis } from '@upstash/redis'
import { LRUCache } from 'lru-cache'

// Environment variables
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600') // Default 1 hour in seconds

// Configure Redis client if environment variables are available
let redisClient: Redis | null = null
if (REDIS_URL && REDIS_TOKEN) {
  redisClient = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
  })
}

// In-memory LRU cache as fallback or for development
const memoryCache = new LRUCache<string, Record<string, unknown>>({
  max: 500, // Maximum items in cache
  ttl: CACHE_TTL * 1000, // Convert to milliseconds
  allowStale: false,
})

/**
 * Generic cache interface
 */
export interface CacheProvider {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, value: T, ttl?: number) => Promise<void>
  delete: (key: string) => Promise<void>
  flush: () => Promise<void>
  deletePattern: (pattern: string) => Promise<number>
  trackKey: (userId: string, key: string) => Promise<void>
}

/**
 * Cache implementation that tries Redis first, then falls back to in-memory LRU cache
 */
class Cache implements CacheProvider {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if available
      if (redisClient) {
        const value = await redisClient.get(key)
        return value as T || null
      }
      
      // Fall back to memory cache
      return memoryCache.get(key) as T || null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl = CACHE_TTL): Promise<void> {
    try {
      // Set in Redis if available
      if (redisClient) {
        await redisClient.set(key, value, { ex: ttl })
      }
      
      // Also set in memory cache
      memoryCache.set(key, value as Record<string, unknown>)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.del(key)
      }
      memoryCache.delete(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Flush the entire cache
   */
  async flush(): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.flushall()
      }
      memoryCache.clear()
    } catch (error) {
      console.error('Cache flush error:', error)
    }
  }

  // Add pattern-based deletion to your cache implementation
  async deletePattern(pattern: string): Promise<number> {
    if (!redisClient) {
      console.warn('Redis not available for pattern deletion');
      return 0;
    }
    
    let cursor = '0';
    let deletedCount = 0;
    
    do {
      // Use SCAN to find keys matching the pattern
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        {
          match: pattern,
          count: 100
        }
      );
      cursor = nextCursor;
      // Delete the found keys
      if (keys.length > 0) {
        const deleted = await redisClient.del(...keys);
        deletedCount += deleted;
      }
    } while (cursor !== '0');
    
    return deletedCount;
  }

  // Add the tracking method if you're using that approach
  async trackKey(userId: string, key: string): Promise<void> {
    // Implementation of trackKey method
  }
}

// Export a singleton instance
export const cache = new Cache()

/**
 * Higher-order function to cache the results of any async function
 */
export function withCache<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  keyPrefix: string,
  ttl?: number
) {
  return async (...args: Args): Promise<T> => {
    // Create a cache key based on the function name, prefix and arguments
    const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`
    
    // Try to get from cache first
    const cached = await cache.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }
    
    // If not in cache, call the function
    const result = await fn(...args)
    
    // Cache the result
    await cache.set<T>(cacheKey, result, ttl)
    
    return result
  }
}

/**
 * Decorator for class methods to cache their results
 * Fixed to work with TypeScript's type checking for method decorators
 */
export function Cached(keyPrefix: string, ttl?: number): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: unknown[]) {
      const cacheKey = `${keyPrefix}:${String(propertyKey)}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // If not in cache, call the original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await cache.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}