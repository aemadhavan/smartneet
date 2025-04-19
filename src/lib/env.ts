// lib/env.ts (environment configuration)
/**
 * Type-safe environment configuration
 */

// Default TTL values in seconds
const DEFAULT_CACHE_TTL = 3600 // 1 hour
const DEFAULT_SUBJECT_CACHE_TTL = 86400 // 24 hours
const DEFAULT_TOPIC_CACHE_TTL = 43200 // 12 hours
const DEFAULT_QUESTION_CACHE_TTL = 21600 // 6 hours
const DEFAULT_USER_PROGRESS_CACHE_TTL = 300 // 5 minutes

// Environment variables with defaults
export const env = {
  // Redis configuration
  REDIS_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  REDIS_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  
  // Cache TTL settings (in seconds)
  CACHE_TTL: parseInt(process.env.CACHE_TTL || String(DEFAULT_CACHE_TTL)),
  SUBJECT_CACHE_TTL: parseInt(process.env.SUBJECT_CACHE_TTL || String(DEFAULT_SUBJECT_CACHE_TTL)),
  TOPIC_CACHE_TTL: parseInt(process.env.TOPIC_CACHE_TTL || String(DEFAULT_TOPIC_CACHE_TTL)),
  QUESTION_CACHE_TTL: parseInt(process.env.QUESTION_CACHE_TTL || String(DEFAULT_QUESTION_CACHE_TTL)),
  USER_PROGRESS_CACHE_TTL: parseInt(process.env.USER_PROGRESS_CACHE_TTL || String(DEFAULT_USER_PROGRESS_CACHE_TTL)),
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // Helper method to check if Redis is configured
  isRedisConfigured(): boolean {
    return Boolean(this.REDIS_URL && this.REDIS_TOKEN)
  }
}