// src/components/subscription/SubscriptionLimitDisplay.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Award, Info } from 'lucide-react';

interface TestLimitStatus {
  canTake: boolean;
  isUnlimited?: boolean;
  usedToday: number;
  remainingToday: number;
  limitPerDay: number | null;
  reason?: string;
}

export default function SubscriptionLimitDisplay({ refreshKey }: { refreshKey?: number }) {
  const [limitStatus, setLimitStatus] = useState<TestLimitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLimitStatus = async () => {
      try {
        setLoading(true);
        // Add a cache-busting query parameter when needed
        const response = await fetch(`/api/user/test-limits?t=${refreshKey || Date.now()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch test limits');
        }
        
        const data = await response.json();
        setLimitStatus(data.limitStatus);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching test limits:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLimitStatus();
  }, [refreshKey]); // Add refreshKey to the dependency array

  if (loading) {
    return (
      <div className="flex items-center text-gray-600 dark:text-gray-300">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <span className="text-sm">Checking test limits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
        <Info className="h-4 w-4 mr-1" />
        <span>Unable to check test limits</span>
      </div>
    );
  }

  if (!limitStatus) {
    return null;
  }

  // For premium users with unlimited tests
  if (limitStatus.isUnlimited) {
    return (
      <div className="flex items-center text-emerald-600 dark:text-emerald-400">
        <Award className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Premium: Unlimited Tests</span>
      </div>
    );
  }

  // For free users with limited tests
  const limitReached = !limitStatus.canTake;
  return (
    <div className={`text-sm ${limitReached ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
      <div className="flex items-center mb-1">
        {limitReached ? (
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
        ) : (
          <Info className="h-4 w-4 mr-1 flex-shrink-0" />
        )}
        <span>
          {limitReached 
            ? 'Daily test limit reached' 
            : `${limitStatus.remainingToday}/${limitStatus.limitPerDay} tests remaining today`}
        </span>
      </div>
      
      {limitReached && (
        <Link 
          href="/pricing" 
          className="block mt-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 py-1 px-3 rounded text-center transition-colors"
        >
          Upgrade to Premium
        </Link>
      )}
    </div>
  );
}