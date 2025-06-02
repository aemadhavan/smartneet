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
      try {
        const value = await redisClient.get(key);
        if (value !== null && value !== undefined) {
          return value as T;
        }
        // If Redis fails, log and fall back to memory cache
      } catch (redisError) {
        console.error('Redis get error:', redisError);
        console.log('Falling back to memory cache');
      }
    }
    
    // Fall back to memory cache
    const memoryValue = memoryCache.get(key);
    return memoryValue as T || null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl = CACHE_TTL): Promise<void> {
    try {
      // Set in Redis if available
      if (redisClient) {
        // Ensure TTL is a valid positive integer
        const validTtl = Math.max(1, Math.floor(ttl));
        await redisClient.set(key, value, { ex: validTtl });
      }
      
      // Also set in memory cache
      memoryCache.set(key, value as Record<string, unknown>);
    } catch (error) {
      console.error('Cache set error:', error);
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

  /**
   * Track a cache key for a specific user
   * This helps with user-specific cache invalidation
   */
  async trackKey(userId: string, key: string): Promise<void> {
    try {
      const userKeysSetKey = `user:${userId}:cache-keys`;
      
      if (redisClient) {
        // Add the key to the user's set in Redis
        await redisClient.sadd(userKeysSetKey, key);
        // Set expiry on the set to prevent unbounded growth
        await redisClient.expire(userKeysSetKey, 86400); // 24 hours TTL
      } else {
        // For memory cache, maintain a simple set of keys
        const userKeys = await this.get<string[]>(userKeysSetKey) || [];
        if (!userKeys.includes(key)) {
          userKeys.push(key);
          await this.set(userKeysSetKey, userKeys, 86400);
        }
      }
    } catch (error) {
      console.error('Cache trackKey error:', error);
    }
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

/**
 * Enhanced withCache that supports cache busting and better error handling
 */
export function withCacheAdvanced<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  keyPrefix: string,
  ttl = CACHE_TTL,
  options: {
    forceRefresh?: boolean;
    onError?: (error: unknown) => Promise<T | null>;
    extendTtlOnHit?: boolean;
  } = {}
) {
  return async (...args: Args): Promise<T> => {
    // Create a cache key based on the function name, prefix and arguments
    const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
    
    // Skip cache if forceRefresh is true
    if (!options.forceRefresh) {
      // Try to get from cache first
      const cached = await cache.get<T>(cacheKey);
      if (cached !== null) {
        // Optionally extend TTL on cache hit to keep frequently used data fresh
        if (options.extendTtlOnHit) {
          await cache.set<T>(cacheKey, cached, ttl);
        }
        return cached;
      }
    }
    
    try {
      // If not in cache or forceRefresh, call the function
      const result = await fn(...args);
      
      // Cache the result
      await cache.set<T>(cacheKey, result, ttl);
      
      return result;
    } catch (error) {
      // Handle error with custom callback if provided
      if (options.onError) {
        const fallbackData = await options.onError(error);
        if (fallbackData !== null) {
          return fallbackData;
        }
      }
      
      // Re-throw the error if no fallback
      throw error;
    }
  };
}