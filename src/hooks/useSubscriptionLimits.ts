'use client';

// src/hooks/useSubscriptionLimits.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { handleFetchError, fetchWithTimeout, silentAbort } from '@/utils/fetchErrorHandler';

export interface TestLimitStatus {
  canTake: boolean;
  isUnlimited?: boolean;
  usedToday: number;
  remainingToday: number;
  limitPerDay: number | null;
  reason?: string | null; // Made nullable to match API response
}

export interface SubscriptionInfo {
  id: number;
  planName: string;
  planCode: string;
  status: string;
  lastTestDate?: string | null; // Added to match API response
}

interface UseSubscriptionLimitsResult {
  limitStatus: TestLimitStatus | null;
  subscription: SubscriptionInfo | null;
  isPremium: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Default subscription data to use if API is unavailable
const DEFAULT_FREE_SUBSCRIPTION = {
  limitStatus: {
    canTake: true,
    isUnlimited: false,
    usedToday: 0,
    remainingToday: 3,
    limitPerDay: 3,
    reason: null
  },
  subscription: {
    id: 0,
    planName: 'Free Plan',
    planCode: 'free',
    status: 'active',
    lastTestDate: null
  }
};

export function useSubscriptionLimits(): UseSubscriptionLimitsResult {
  // State for subscription data
  const [limitStatus, setLimitStatus] = useState<TestLimitStatus | null>(DEFAULT_FREE_SUBSCRIPTION.limitStatus);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(DEFAULT_FREE_SUBSCRIPTION.subscription);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Refs for tracking request state
  const fetchInProgress = useRef<boolean>(false);
  const abortController = useRef<AbortController | null>(null);
  const lastFetchTime = useRef<number>(0);
  const mounted = useRef<boolean>(true);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const isRetrying = useRef<boolean>(false);

  // Load cached data from localStorage on mount
  useEffect(() => {
    // Set the mounted ref
    mounted.current = true;
    
    // Try to load cached data from localStorage
    try {
      const cachedData = localStorage.getItem('subscription_data');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Check if cache is still valid (15 minutes)
        const cacheAge = Date.now() - (parsedData.timestamp || 0);
        const cacheValid = cacheAge < 15 * 60 * 1000; // 15 minutes
        
        if (cacheValid) {
          // Use cached data
          setLimitStatus(parsedData.limitStatus || DEFAULT_FREE_SUBSCRIPTION.limitStatus);
          setSubscription(parsedData.subscription || DEFAULT_FREE_SUBSCRIPTION.subscription);
          setIsPremium(parsedData.subscription?.planCode !== 'free');
          console.log('Using cached subscription data:', new Date(parsedData.timestamp).toISOString());
        }
      }
    } catch (error) {
      console.warn('Error loading cached subscription data:', error);
    }
    
    // Cleanup function
    return () => {
      mounted.current = false;

      // Cancel any in-flight requests using silent abort (won't throw errors)
      silentAbort(abortController.current);
      abortController.current = null;

      // Clear any retry timeouts
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
        retryTimeout.current = null;
      }
    };
  }, []);

  // Function to fetch subscription data
  const fetchSubscriptionData = useCallback(async (forceRefresh: boolean = false) => {
    // Don't fetch if a request is already in progress
    if (fetchInProgress.current && !forceRefresh) {
      return;
    }
    
    // Implement debouncing - prevent frequent refetches
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    // Only allow a forced refresh every 3 seconds
    if (forceRefresh && timeSinceLastFetch < 3000) {
      console.log('Debouncing forced refresh - too soon since last fetch');
      return;
    }
    
    // Only allow automatic refresh every 30 seconds
    if (!forceRefresh && timeSinceLastFetch < 30000) {
      console.log('Skipping automatic refresh - too soon since last fetch');
      return;
    }
    
    // Cancel any existing request using silent abort
    silentAbort(abortController.current);

    // Set up new request
    abortController.current = new AbortController();
    fetchInProgress.current = true;
    lastFetchTime.current = now;

    // Only show loading for forced refreshes (user-initiated)
    if (forceRefresh) {
      setError(null);
      setLoading(true);
    }

    try {
      // Use fetchWithTimeout utility for proper error handling
      // Higher timeout for subscription limits to avoid unnecessary errors
      const response = await fetchWithTimeout(
        `/api/user/test-limits?t=${now}`,
        {
          timeout: 15000, // 15 second timeout (matches other critical fetches)
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        },
        () => {
          // Only log timeout for forced refresh (user-initiated)
          if (forceRefresh) {
            console.log('Subscription limits fetch timeout');
          }
        }
      );

      // Process response
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Only update state if component is still mounted
      if (mounted.current) {
        // Update state with API data
        setLimitStatus(data.limitStatus || DEFAULT_FREE_SUBSCRIPTION.limitStatus);
        setSubscription(data.subscription || DEFAULT_FREE_SUBSCRIPTION.subscription);
        setIsPremium(data.subscription?.planCode !== 'free');
        setError(null);
        
        // Cache the response in localStorage
        try {
          localStorage.setItem('subscription_data', JSON.stringify({
            ...data,
            timestamp: now
          }));
          console.log('Updated subscription data cache, source:', data.source);
        } catch (storageError) {
          console.warn('Failed to cache subscription data:', storageError);
        }
      }
    } catch (error) {
      // Use the error handler utility
      const errorInfo = handleFetchError(error, 'subscription limits');

      // Don't log or handle expected errors (AbortError from cleanup)
      if (errorInfo.isExpected) {
        // Component unmounted or request was cancelled - this is expected
        return;
      }

      // For background fetches, silently use cached data (no logging, no error state)
      // This prevents console noise from automatic periodic refreshes
      if (!forceRefresh) {
        // Background fetch failed - silently fall back to cached data
        // Only log critical errors (not timeouts or network issues)
        if (errorInfo.shouldLog && !errorInfo.shouldRetry) {
          console.warn('Background subscription fetch failed (using cache):',
            error instanceof Error ? error.message : 'Unknown error');
        }
        return;
      }

      // Only handle errors for user-initiated refreshes below this point
      if (mounted.current) {
        // Keep using previous data but show user-friendly error
        setError(errorInfo.userMessage || 'Failed to fetch subscription data');

        // Log only non-retryable errors (rate limits, auth issues, etc.)
        // Don't log timeout/network errors as they're transient
        if (errorInfo.shouldLog && !errorInfo.shouldRetry) {
          console.error('Error fetching subscription data:', error);
        }

        // Schedule a retry for retryable errors (timeout, network), but only if not already retrying
        if (errorInfo.shouldRetry && !isRetrying.current) {
          isRetrying.current = true;

          if (retryTimeout.current) {
            clearTimeout(retryTimeout.current);
          }

          retryTimeout.current = setTimeout(() => {
            if (mounted.current) {
              console.log('Retrying subscription data fetch after transient failure');
              isRetrying.current = false;
              fetchSubscriptionData(true);
            }
          }, 5000);
        }
      }
    } finally {
      // Clean up
      if (mounted.current) {
        setLoading(false);
      }

      fetchInProgress.current = false;
      abortController.current = null;
    }
  }, []);

  // Fetch data when component mounts or refresh is triggered
  useEffect(() => {
    // TEMP: Bypass subscription check - set unlimited premium
    setLimitStatus({
      canTake: true,
      isUnlimited: true,
      usedToday: 0,
      remainingToday: 999,
      limitPerDay: null,
      reason: null
    });
    setSubscription({
      id: 999,
      planName: 'Premium Plan (Bypass)',
      planCode: 'premium',
      status: 'active',
      lastTestDate: null
    });
    setIsPremium(true);
    setLoading(false);
    return;

    // // Skip in SSR context
    // if (typeof window === 'undefined') {
    //   return;
    // }
    //
    // // Fetch on mount or refresh counter change
    // fetchSubscriptionData(refreshCounter > 0);
    //
    // // Also set up a periodic refresh every 5 minutes
    // const intervalId = setInterval(() => {
    //   fetchSubscriptionData(false);
    // }, 5 * 60 * 1000);
    //
    // return () => {
    //   clearInterval(intervalId);
    // };
  }, [fetchSubscriptionData, refreshCounter]);

  // Function to manually trigger a refresh
  const refetch = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  return {
    limitStatus,
    subscription,
    isPremium,
    loading,
    error,
    refetch
  };
}