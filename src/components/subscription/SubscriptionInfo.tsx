// src/components/subscription/SubscriptionInfo.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { formatAmountForDisplay } from '@/lib/stripe';

type SubscriptionPlan = {
  plan_id: number;
  plan_name: string;
  plan_code: string;
  description: string;
  price_inr: number;
  price_id_stripe: string;
  product_id_stripe: string;
  features: string[];
  test_limit_daily: number | null;
  duration_days: number;
  is_active: boolean;
};

type UserSubscription = {
  subscription_id: number;
  user_id: string;
  plan_id: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  tests_used_today: number;
  tests_used_total: number;
  plan?: SubscriptionPlan;
};

// Custom error type for better type safety - we'll use it for type assertions, not in catch clauses
type AppError = Error | { message: string };

const SubscriptionInfo = () => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  // Fetch subscription data
  useEffect(() => {
    if (!isLoaded || !userId) return;

    const fetchSubscription = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/user/subscription');
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        const data = await response.json();
        setSubscription(data.subscription);
      } catch (err: unknown) {
        // Type assertion for the error
        const error = err as AppError;
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId, isLoaded]);

  // Handle subscription management
  const handleManageSubscription = async () => {
    if (!subscription?.stripe_customer_id) {
      setError('No active subscription found');
      return;
    }

    setIsManaging(true);
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: subscription.stripe_customer_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to access customer portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: unknown) {
      // Type assertion for the error
      const error = err as AppError;
      setError(error.message);
    } finally {
      setIsManaging(false);
    }
  };

  // Handle cancellation
  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      setError('No active subscription found');
      return;
    }

    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh subscription data
      router.refresh();
    } catch (err: unknown) {
      // Type assertion for the error
      const error = err as AppError;
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="p-6 bg-white rounded-lg shadow-md">Loading subscription information...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={() => setError(null)} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">No Subscription Found</h2>
        <p>You don&apos;t have an active subscription. Choose a plan to get started.</p>
        <button 
          onClick={() => router.push('/pricing')} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          View Plans
        </button>
      </div>
    );
  }

  const currentPlan = subscription.plan;
  const isFreePlan = currentPlan?.plan_code === 'free';
  const endDate = new Date(subscription.current_period_end);
  const formattedEndDate = endDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Your Subscription</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Current Plan</p>
          <p className="font-medium">{currentPlan?.plan_name || 'Unknown Plan'}</p>
        </div>
        
        {!isFreePlan && (
          <>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  subscription.status === 'active' ? 'bg-green-500' : 
                  subscription.status === 'trialing' ? 'bg-blue-500' : 'bg-red-500'
                }`}></span>
                <p className="font-medium capitalize">{subscription.status}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Renewal Date</p>
              <p className="font-medium">
                {subscription.cancel_at_period_end 
                  ? `Expires on ${formattedEndDate}` 
                  : `Renews on ${formattedEndDate}`}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium">
                {currentPlan ? formatAmountForDisplay(currentPlan.price_inr) : 'N/A'}{' '}
                {currentPlan?.duration_days === 30 && '/ month'}
                {currentPlan?.duration_days === 90 && '/ quarter'}
                {currentPlan?.duration_days === 365 && '/ year'}
              </p>
            </div>
          </>
        )}
        
        <div>
          <p className="text-sm text-gray-500">Tests Limit</p>
          <p className="font-medium">
            {currentPlan?.test_limit_daily === null 
              ? 'Unlimited tests per day' 
              : `${currentPlan?.test_limit_daily} tests per day`}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Tests Used Today</p>
          <p className="font-medium">{subscription.tests_used_today} tests</p>
          {currentPlan?.test_limit_daily && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (subscription.tests_used_today / currentPlan.test_limit_daily) * 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {isFreePlan ? (
          <button
            onClick={() => router.push('/pricing')}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Upgrade to Premium
          </button>
        ) : (
          <>
            <button
              onClick={handleManageSubscription}
              disabled={isManaging}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isManaging ? 'Loading...' : 'Manage Subscription'}
            </button>
            
            {!subscription.cancel_at_period_end && (
              <button
                onClick={handleCancelSubscription}
                className="w-full sm:w-auto px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
              >
                Cancel Subscription
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionInfo;