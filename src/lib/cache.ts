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
const memoryCache = new LRUCache<string, any>({
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
      memoryCache.set(key, value, { ttl: ttl * 1000 })
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
}

// Export a singleton instance
export const cache = new Cache()

/**
 * Higher-order function to cache the results of any async function
 */
export function withCache<T>(
  fn: (...args: any[]) => Promise<T>,
  keyPrefix: string,
  ttl?: number
) {
  return async (...args: any[]): Promise<T> => {
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
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
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