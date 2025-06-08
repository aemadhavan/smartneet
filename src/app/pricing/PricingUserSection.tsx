"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { getStripe, formatAmountForDisplay } from '@/lib/stripe';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

// Types
// (Repeat SubscriptionPlan type for local use)
type SubscriptionPlan = {
  plan_id: number;
  plan_name: string;
  plan_code: string;
  description: string;
  price_inr: number;
  price_id_stripe: string;
  features: string[];
  test_limit_daily: number | null;
  duration_days: number;
  is_active: boolean;
};

type UserSubscription = {
  subscription_id: number;
  plan_id: number;
  plan?: SubscriptionPlan;
  status: string;
  cancel_at_period_end: boolean;
};

interface PricingUserSectionProps {
  plans: SubscriptionPlan[];
}

function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const canceled = searchParams?.get('canceled') === 'true';
  
  return (
    <>
      {canceled && (
        <div className="max-w-lg mx-auto mb-8 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 flex-shrink-0" />
          <p className="text-yellow-700 dark:text-yellow-400">
            Your checkout session was canceled. You have not been charged.
          </p>
        </div>
      )}
      {children}
    </>
  );
}

export default function PricingUserSection({ plans }: PricingUserSectionProps) {
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  // Fetch user subscription if logged in
  useEffect(() => {
    const fetchUserSub = async () => {
      setLoading(true);
      try {
        if (isSignedIn) {
          const subResponse = await fetch('/api/user/subscription');
          if (subResponse.ok) {
            const subData = await subResponse.json();
            setUserSubscription(subData.subscription);
          }
        }
      } catch {
        // Ignore error, just show as not subscribed
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded) fetchUserSub();
  }, [isSignedIn, isLoaded]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent('/pricing')}`);
      return;
    }
    if (userSubscription?.plan?.plan_id === plan.plan_id) {
      router.push('/dashboard/subscription');
      return;
    }
    setIsCheckingOut(true);
    setCheckoutPlanId(plan.plan_id);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.plan_id }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      const data = await response.json();
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else if (data.sessionId) {
        const stripe = await getStripe();
        if (!stripe) throw new Error('Could not initialize Stripe.');
        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) throw new Error(result.error.message || 'Error redirecting to checkout');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unknown error occurred during checkout');
      } else {
        setError('An unknown error occurred during checkout');
      }
    } finally {
      setIsCheckingOut(false);
      setCheckoutPlanId(null);
    }
  };

  return (
    <>
      <SearchParamsWrapper>
        {error && (
          <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Dismiss
            </button>
          </div>
        )}
      </SearchParamsWrapper>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isUserOnThisPlan = userSubscription?.plan?.plan_id === plan.plan_id;
          const isFreePlan = plan.plan_code === 'free';
          const isCheckingOutThisPlan = isCheckingOut && checkoutPlanId === plan.plan_id;
          const isCanceledPlan = isUserOnThisPlan && userSubscription?.cancel_at_period_end;
          return (
            <div
              key={plan.plan_id}
              className={`border rounded-lg overflow-hidden transition ${
                isUserOnThisPlan
                  ? 'border-green-500 dark:border-green-400 ring-2 ring-green-500 dark:ring-green-400 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:shadow-lg'
              }`}
            >
              <div className="bg-gray-50 dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{plan.plan_name}</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatAmountForDisplay(plan.price_inr)}
                  </span>
                  {!isFreePlan && (
                    <span className="text-gray-600 dark:text-gray-300 ml-1">
                      /{plan.duration_days === 30
                        ? 'month'
                        : plan.duration_days === 90
                        ? 'quarter'
                        : 'year'}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-gray-900">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">
                      {plan.test_limit_daily === null
                        ? 'Unlimited tests per day'
                        : `${plan.test_limit_daily} tests per day`}
                    </span>
                  </li>
                  {(plan.features || []).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                      <span className="text-gray-800 dark:text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCheckingOut}
                    className={`w-full py-3 px-4 rounded font-medium transition ${
                      isCheckingOut
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                        : isUserOnThisPlan
                        ? isCanceledPlan
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : isFreePlan
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                    }`}
                  >
                    {isCheckingOutThisPlan ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Processing...
                      </span>
                    ) : isUserOnThisPlan ? (
                      isCanceledPlan ? 'Renew Subscription' : 'Current Plan'
                    ) : isFreePlan ? (
                      'Start Free'
                    ) : (
                      'Select Plan'
                    )}
                  </button>
                </div>
                {isUserOnThisPlan && !isFreePlan && (
                  <div className="mt-2 text-center">
                    <button
                      onClick={() => router.push('/dashboard/subscription')}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Manage Subscription
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          // Skeleton loader for user subscription
          <div className="col-span-full flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <span className="ml-2 text-gray-500 dark:text-gray-300">Loading your subscription...</span>
          </div>
        )}
      </div>
    </>
  );
} 