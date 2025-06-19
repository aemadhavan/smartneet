//File: src/hooks/useSubscription.ts
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

// IMPORTANT: Don't import server-side modules directly
// import { subscriptionService } from '@/lib/services/SubscriptionService'; // Remove this

export interface SubscriptionData {
  isPremium: boolean;
  maxTopicsPerSubject: number;
  maxTestsPerDay: number | null;
  remainingTests: number;
  planName: string;
  planCode: 'free' | 'premium' | 'institutional';
  expiresAt: Date | null;
}

// Create a client-side API function to fetch subscription data
const fetchSubscriptionData = async (userId: string, skipCache = false) => {
  try {
    const url = `/api/subscription?userId=${userId}${skipCache ? '&t=' + Date.now() : ''}`;
    const response = await fetch(url, {
      headers: skipCache ? {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      } : {}
    });
    if (!response.ok) {
      throw new Error('Failed to fetch subscription data');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    throw error;
  }
};

export function useSubscription() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    isPremium: false,
    maxTopicsPerSubject: 2,
    maxTestsPerDay: 3,
    remainingTests: 3,
    planName: 'Free',
    planCode: 'free',
    expiresAt: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function getSubscriptionData() {
      if (!isLoaded) return;
      
      // If user is not signed in, use default free data
      if (!isSignedIn || !userId) {
        setSubscriptionData({
          isPremium: false,
          maxTopicsPerSubject: 2,
          maxTestsPerDay: 3,
          remainingTests: 3,
          planName: 'Free',
          planCode: 'free',
          expiresAt: null
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch subscription data from API endpoint (skip cache on refresh)
        const result = await fetchSubscriptionData(userId, refreshTrigger > 0);
        
        if (result.success) {
          const subData = result.data;
          setSubscriptionData({
            isPremium: subData.isPremium,
            maxTopicsPerSubject: subData.maxTopicsPerSubject,
            maxTestsPerDay: subData.maxTestsPerDay,
            remainingTests: subData.remainingTests,
            planName: subData.planName,
            planCode: subData.planCode,
            expiresAt: subData.expiresAt ? new Date(subData.expiresAt) : null
          });
        } else {
          throw new Error(result.error || 'Failed to load subscription data');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription data');
        
        // Set default values on error
        setSubscriptionData({
          isPremium: false,
          maxTopicsPerSubject: 2,
          maxTestsPerDay: 3,
          remainingTests: 3,
          planName: 'Free',
          planCode: 'free',
          expiresAt: null
        });
      } finally {
        setIsLoading(false);
      }
    }

    getSubscriptionData();
  }, [userId, isLoaded, isSignedIn, refreshTrigger]);

  /**
   * Check if the user can access a specific topic based on its index
   */
  const canAccessTopic = (topicIndex: number): boolean => {
    return subscriptionData.isPremium || topicIndex < subscriptionData.maxTopicsPerSubject;
  };

  /**
   * Check if the user can take a test
   */
  const canTakeTest = (): boolean => {
    return subscriptionData.isPremium || subscriptionData.remainingTests > 0;
  };

  /**
   * Refresh subscription data from the server
   */
  const refreshSubscriptionData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    ...subscriptionData,
    isLoading,
    error,
    canAccessTopic,
    canTakeTest,
    refreshSubscriptionData
  };
}

export default useSubscription;