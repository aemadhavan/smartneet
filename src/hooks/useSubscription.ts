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
const fetchSubscriptionData = async (userId: string) => {
  try {
    const response = await fetch(`/api/subscription?userId=${userId}`);
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
        
        // Fetch subscription data from API endpoint instead of direct service call
        const result = await fetchSubscriptionData(userId);
        
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
  }, [userId, isLoaded, isSignedIn]);

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

  return {
    ...subscriptionData,
    isLoading,
    error,
    canAccessTopic,
    canTakeTest
  };
}

export default useSubscription;