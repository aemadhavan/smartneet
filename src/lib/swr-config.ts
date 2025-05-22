// src/lib/swr-config.ts
import { SWRConfiguration } from 'swr';
import { logger } from './logger';

/**
 * Common configuration for SWR hooks
 */
export const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,  // Don't revalidate when window gets focus
  revalidateIfStale: true,   // Revalidate if data is stale
  dedupingInterval: 30000,   // Deduplicate requests with the same key for 30 seconds
  errorRetryCount: 3,        // Retry 3 times on error
  focusThrottleInterval: 5000, // Throttle focus revalidation
  loadingTimeout: 5000,      // Set loading timeout
  onError: (error: Error | string) => {
    // Log the error
    logger.error('SWR error', {
      context: 'swr-config',
      error: error instanceof Error ? error.message : error
    });
  },
};

/**
 * Generic fetcher function for SWR
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${response.statusText}`);
    error.name = 'FetchError';
    throw error;
  }

  const data = await response.json();
  
  // For our API convention, success data is usually in data field
  if (data && 'data' in data) {
    return data.data as T;
  }
  
  // Return raw data if it doesn't follow our convention
  return data as T;
};

/**
 * POST fetcher for SWR mutations
 */
export const postFetcher = async <T, P>(url: string, payload: P): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${response.statusText}`);
    error.name = 'FetchError';
    throw error;
  }

  const data = await response.json();
  
  // For our API convention, success data is usually in data field
  if (data && 'data' in data) {
    return data.data as T;
  }
  
  // Return raw data if it doesn't follow our convention
  return data as T;
};

/**
 * Helper function to create a cache key from parameters
 */
export const createCacheKey = (
  baseKey: string, 
  params: Record<string, string | number | boolean | null | undefined>
): string => {
  const query = new URLSearchParams();
  
  // Sort keys to ensure consistent cache keys
  Object.keys(params)
    .sort()
    .forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        query.append(key, String(params[key]));
      }
    });
  
  const queryString = query.toString();
  return queryString ? `${baseKey}?${queryString}` : baseKey;
};