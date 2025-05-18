// src/hooks/useSubscriptionLimits.ts
import { useState, useEffect } from 'react';

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
  const [loading, setLoading] = useState(false); // Start with false to prevent blocking UI
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Load cached data on mount (outside useEffect)
  useEffect(() => {
    // Immediately try to load from localStorage when component mounts
    try {
      const cachedData = localStorage.getItem('subscription_data');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Always use cached data immediately to ensure UI is responsive
        setLimitStatus(parsedData.limitStatus || DEFAULT_FREE_SUBSCRIPTION.limitStatus);
        setSubscription(parsedData.subscription || DEFAULT_FREE_SUBSCRIPTION.subscription);
        setIsPremium(parsedData.subscription?.planCode !== 'free');
        console.log('Initial render using cached data:', parsedData.subscription?.planCode);
      }
    } catch (e) {
      console.warn('Could not load cached subscription data on initial render');
    }
  }, []);

  // Then fetch fresh data
  useEffect(() => {
    let isMounted = true;
    let controller: AbortController | null = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchLimitStatus = async () => {
      // Don't block UI with loading state since we already have default/cached data
      setLoading(true);
      
      // Use a short timeout (3 seconds) since we already have data to display
      timeoutId = setTimeout(() => {
        if (controller) {
          controller.abort();
          console.warn('Subscription API request timed out after 3 seconds');
          
          if (isMounted) {
            setError('API not responding - using cached data');
            setLoading(false);
          }
        }
      }, 3000);
      
      try {
        const timeStamp = Date.now();
        // Attempt to fetch fresh data in the background
        const response = await fetch(`/api/user/test-limits?t=${timeStamp}`, {
          signal: controller?.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (timeoutId) clearTimeout(timeoutId);
        if (!isMounted) return;
        
        if (!response.ok) {
          // Just log the error but don't update state - keep using cached/default data
          console.warn('API returned error status:', response.status);
          return;
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        
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
            timestamp: Date.now()
          }));
          console.log('Updated cached subscription data, source:', data.source);
        } catch (e) {
          console.warn('Failed to update subscription cache');
        }
      } catch (e) {
        // Just log errors but don't change UI state
        console.warn('Error fetching subscription data:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        
        if (timeoutId) clearTimeout(timeoutId);
        controller = null;
      }
    };
    
    // Only attempt to fetch if we're in a browser environment
    if (typeof window !== 'undefined') {
      fetchLimitStatus();
    }
    
    return () => {
      isMounted = false;
      if (controller) controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [refreshCounter]);

  const refetch = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return {
    limitStatus,
    subscription,
    isPremium,
    loading,
    error,
    refetch
  };
}
