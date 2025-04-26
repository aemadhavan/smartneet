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
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSubscriptionLimits(): UseSubscriptionLimitsResult {
  const [limitStatus, setLimitStatus] = useState<TestLimitStatus | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const fetchLimitStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/test-limits');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch test limits');
        }
        
        const data = await response.json();
        setLimitStatus(data.limitStatus);
        setSubscription(data.subscription);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching test limits:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLimitStatus();
  }, [refreshCounter]);

  const refetch = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return {
    limitStatus,
    subscription,
    loading,
    error,
    refetch
  };
}