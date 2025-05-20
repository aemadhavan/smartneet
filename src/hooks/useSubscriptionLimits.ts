// src/hooks/useSubscriptionLimits.ts
import { useState, useEffect, useCallback } from 'react';

export interface TestLimitStatus {
  canTake: boolean;
  isUnlimited?: boolean;
  usedToday: number;
  remainingToday: number;
  limitPerDay: number | null;
  reason?: string;
}

export interface SubscriptionInfo {
  id: number;
  planName: string;
  planCode: string;
  status: string;
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
    reason: undefined
  },
  subscription: {
    id: 0,
    planName: 'Free Plan',
    planCode: 'free',
    status: 'active'
  }
};

export function useSubscriptionLimits(): UseSubscriptionLimitsResult {
  // Initialize with default data so UI can render immediately
  const [limitStatus, setLimitStatus] = useState<TestLimitStatus | null>(DEFAULT_FREE_SUBSCRIPTION.limitStatus);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(DEFAULT_FREE_SUBSCRIPTION.subscription);
  const [isPremium, setIsPremium] = useState<boolean>(false); // Default to non-premium
  const [loading, setLoading] = useState(true); // Start with true to indicate initial loading
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  
  // Load cached data on mount
  useEffect(() => {
    // Immediately try to load from localStorage when component mounts
    try {
      const cachedData = localStorage.getItem('subscription_data');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Check if cache is still valid (within 5 minutes)
        const cacheAge = Date.now() - (parsedData.timestamp || 0);
        const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes
        
        if (cacheValid) {
          // Always use cached data immediately to ensure UI is responsive
          setLimitStatus(parsedData.limitStatus || DEFAULT_FREE_SUBSCRIPTION.limitStatus);
          setSubscription(parsedData.subscription || DEFAULT_FREE_SUBSCRIPTION.subscription);
          setIsPremium(parsedData.subscription?.planCode !== 'free');
          console.log('Initial render using cached data:', parsedData.subscription?.planCode);
        }
      }
    } catch (error) {
      console.warn('Could not load cached subscription data on initial render:', error);
    }
  }, []);

  // Function to fetch fresh data
  const fetchLimitStatus = useCallback(async () => {
    // Don't re-fetch if we just did within the last second (debounce)
    const now = Date.now();
    if (now - lastRefreshTime < 1000) {
      return;
    }
    
    setLastRefreshTime(now);
    setLoading(true);
    
    // Reference to abort controller for timeout handling
    let controller: AbortController | null = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Use a short timeout (3 seconds) since we already have data to display
    timeoutId = setTimeout(() => {
      if (controller) {
        controller.abort();
        console.warn('Subscription API request timed out after 3 seconds');
        setError('API not responding - using cached data');
        setLoading(false);
      }
    }, 3000);
    
    try {
      const timeStamp = now;
      // Attempt to fetch fresh data with cache-busting
      const response = await fetch(`/api/user/test-limits?t=${timeStamp}`, {
        signal: controller?.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle error response
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn('API returned error status:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state with fresh data
      setLimitStatus(data.limitStatus || DEFAULT_FREE_SUBSCRIPTION.limitStatus);
      setSubscription(data.subscription || DEFAULT_FREE_SUBSCRIPTION.subscription);
      
      const premium = data.subscription?.planCode !== 'free';
      setIsPremium(premium);
      
      // Clear any previous errors
      setError(null);
      
      // Update localStorage cache
      try {
        localStorage.setItem('subscription_data', JSON.stringify({
          ...data,
          timestamp: now
        }));
        console.log('Updated cached subscription data, source:', data.source);
      } catch (error) {
        console.warn('Failed to update subscription cache:', error);
      }
    } catch (error) {
      console.warn('Error fetching subscription data:', error);
      
      // Set error but keep using cached/default data
      setError('Failed to fetch subscription data');
      
      // Make sure we have at least the default values
      if (!limitStatus) {
        setLimitStatus(DEFAULT_FREE_SUBSCRIPTION.limitStatus);
      }
      if (!subscription) {
        setSubscription(DEFAULT_FREE_SUBSCRIPTION.subscription);
      }
    } finally {
      setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
      controller = null;
    }
  }, [lastRefreshTime, limitStatus, subscription]);

  // Then fetch fresh data when component mounts or refreshCounter changes
  useEffect(() => {
    // Only attempt to fetch if we're in a browser environment
    if (typeof window !== 'undefined') {
      fetchLimitStatus();
    }
    
    // No cleanup needed as fetchLimitStatus handles its own abort controller
  }, [fetchLimitStatus, refreshCounter]);

  // Expose refetch function for manual refresh
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