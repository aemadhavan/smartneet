import { logger } from '@/lib/logger';

// Constants for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Retry wrapper for database operations that might hit connection limits
 */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      
      // Check if it's a concurrency limit error
      if (
        typeof error === 'object' && 
        error !== null && 
        ('code' in error && error.code === 'XATA_CONCURRENCY_LIMIT' || 
         ('message' in error && typeof error.message === 'string' && 
          error.message.includes('concurrent connections limit exceeded')))
      ) {
        attempt++;
        logger.warn(`Database connection limit exceeded, retrying operation`, {
          context: 'withRetry',
          data: {
            attempt,
            maxRetries: MAX_RETRIES,
            delay: RETRY_DELAY * attempt
          },
          error: error instanceof Error ? error.message : String(error)
        });
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
  
  throw lastError!;
}