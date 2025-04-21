// src/app/pricing/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { formatAmountForDisplay, getStripe } from '@/lib/stripe';
import { Check, AlertCircle } from 'lucide-react';

// Types
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
  // Add other subscription properties as needed
};

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<number | null>(null);
  const [canceled, setCanceled] = useState<string | null>(null);
  
  const router = useRouter();
  const { isSignedIn } = useAuth();

  // Debug environment variables
  useEffect(() => {
    console.log('DEBUG - Stripe key available:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.log('DEBUG - Stripe key prefix:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 10));
    } else {
      console.log('DEBUG - Stripe key is undefined or empty');
    }
  }, []);

  // Refresh Clerk session
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.Clerk !== 'undefined' && window.Clerk.session) {
      try {
        // @ts-ignore
        window.Clerk.session.refresh();
      } catch (e) {
        console.error("Failed to refresh Clerk session", e);
      }
    }
  }, []);

  // Use regular browser APIs to get query params instead of useSearchParams
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setCanceled(searchParams.get('canceled'));
  }, []);

  // Fetch plans and user subscription
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch available plans
        const plansResponse = await fetch('/api/subscription-plans');
        if (!plansResponse.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        const plansData = await plansResponse.json();
        setPlans(plansData.plans);
        
        // Fetch user subscription if logged in
        if (isSignedIn) {
          const subResponse = await fetch('/api/user/subscription');
          if (subResponse.ok) {
            const subData = await subResponse.json();
            setUserSubscription(subData.subscription);
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isSignedIn]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!isSignedIn) {
      // Redirect to sign in page
      router.push(`/sign-in?redirect_url=${encodeURIComponent('/pricing')}`);
      return;
    }
    
    // Check if user is already on this plan
    if (userSubscription?.plan?.plan_id === plan.plan_id) {
      router.push('/dashboard/subscription');
      return;
    }
    
    // Debug Stripe availability
    console.log('DEBUG - Attempting checkout. Stripe key available:', 
      !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    
    // Start checkout process
    setIsCheckingOut(true);
    setCheckoutPlanId(plan.plan_id);
    
    try {
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.plan_id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { sessionId } = await response.json();
      console.log('DEBUG - Got session ID:', sessionId ? 'Yes (valid ID)' : 'No');
      
      // Load Stripe.js and redirect to checkout
      console.log('DEBUG - Loading Stripe.js...');
      const stripe = await getStripe();
      console.log('DEBUG - Stripe loaded:', !!stripe);
      
      if (!stripe) {
        throw new Error('Could not initialize Stripe. Please check if Stripe is properly configured.');
      }
      
      console.log('DEBUG - Redirecting to checkout...');
      const result = await stripe.redirectToCheckout({ sessionId });
      console.log('DEBUG - Redirect result:', result);
      
      if (result.error) {
        throw new Error(result.error.message || 'Error redirecting to checkout');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during checkout';
      setError(errorMessage);
      console.error('Checkout error:', err);
      setIsCheckingOut(false);
      setCheckoutPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-12">Loading Plans...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Display a message if Stripe checkout was canceled
  const showCanceledMessage = canceled === 'true';

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h1>
      <p className="text-lg text-center text-gray-600 mb-12">
        Get unlimited access to all practice tests and study materials
      </p>

      {showCanceledMessage && (
        <div className="max-w-lg mx-auto mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
          <p className="text-yellow-700">
            Your checkout session was canceled. You have not been charged.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isUserOnThisPlan = userSubscription?.plan?.plan_id === plan.plan_id;
          const isFreePlan = plan.plan_code === 'free';
          const isCheckingOutThisPlan = isCheckingOut && checkoutPlanId === plan.plan_id;
          
          return (
            <div 
              key={plan.plan_id}
              className={`border rounded-lg overflow-hidden ${
                isUserOnThisPlan 
                  ? 'border-green-500 ring-2 ring-green-500 shadow-lg' 
                  : 'border-gray-200 hover:shadow-lg transition-shadow'
              }`}
            >
              <div className="bg-gray-50 p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold">{plan.plan_name}</h2>
                <p className="text-gray-600 mt-2">{plan.description}</p>
                
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {formatAmountForDisplay(plan.price_inr)}
                  </span>
                  {!isFreePlan && (
                    <span className="text-gray-600 ml-1">
                      /{plan.duration_days === 30 ? 'month' : plan.duration_days === 90 ? 'quarter' : 'year'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>
                      {plan.test_limit_daily === null 
                        ? 'Unlimited tests per day' 
                        : `${plan.test_limit_daily} tests per day`}
                    </span>
                  </li>
                  
                  {(plan.features || []).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCheckingOut || isUserOnThisPlan}
                    className={`w-full py-3 px-4 rounded font-medium ${
                      isUserOnThisPlan
                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                        : isFreePlan
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCheckingOutThisPlan
                      ? 'Redirecting to checkout...'
                      : isUserOnThisPlan
                      ? 'Current Plan'
                      : isFreePlan
                      ? 'Start Free'
                      : 'Select Plan'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}