// src/app/dashboard/subscription/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  XCircle,
  AlertCircle,
  Calendar as CalendarFull
} from 'lucide-react';
import { formatAmountForDisplay } from '@/lib/stripe';

interface SearchParamsWrapperProps {
  children: React.ReactNode;
}

function SearchParamsWrapper({ children }: SearchParamsWrapperProps) {
  // This component will be wrapped in Suspense by the parent
  const searchParams = useSearchParams();
  const showSuccess = searchParams?.get('success') === 'true';
  
  return (
    <>
      {showSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
          <p className="text-green-700 dark:text-green-300">
            Your subscription has been successfully activated!
          </p>
        </div>
      )}
      {children}
    </>
  );
}

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
};

type UserSubscription = {
  subscription_id: number;
  user_id: string;
  plan_id: number;
  plan: SubscriptionPlan;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_end: string | null;
  tests_used_today: number;
  tests_used_total: number;
  formattedDates: {
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    trialEnd: string | null;
    canceledAt: string | null;
  };
  stripeDetails: {
    status: string;
    cancelAtPeriodEnd: boolean;
    cancelAt: string | null;
    paymentMethod: string | null;
    currency: string;
    customerPortalUrl: string | null;
  } | null;
};

type PaymentHistory = {
  payment_id: number;
  user_id: string;
  subscription_id: number;
  amount_inr: number;
  stripe_payment_id: string;
  payment_status: string;
  payment_date: string;
  receipt_url: string | null;
};

export default function SubscriptionDashboard() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      setLoading(true);
      try {
        // Fetch subscription details
        const response = await fetch('/api/user/subscription');
        if (!response.ok) {
          throw new Error('Failed to fetch subscription details');
        }
        const data = await response.json();
        // Add detailed logging
        console.log('Subscription Data:', {
          fullSubscription: data.subscription,
          status: data.subscription.status,
          cancelAtPeriodEnd: data.subscription.cancel_at_period_end,
          derived: {
            isPremium: data.subscription.plan.plan_code !== 'free',
            isActive: data.subscription.status === 'active' || data.subscription.status === 'trialing',
            isCancelled: data.subscription.cancel_at_period_end,
            isTrialing: data.subscription.status === 'trialing'
          }
        });
        setSubscription(data.subscription);
        
        // Fetch payment history
        const paymentResponse = await fetch('/api/user/payments');
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          setPaymentHistory(paymentData.payments || []);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching subscription data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptionData();
  }, []);

  const handleOpenCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/subscription`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create customer portal session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error opening customer portal:', err);
      setPortalLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setPortalLoading(true);
    try {
      // First, open the customer portal
      await handleOpenCustomerPortal();
      // The user will be redirected to the Stripe portal to reactivate their subscription
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Subscription Details</h1>
        <div className="animate-pulse bg-gray-100 dark:bg-gray-700 h-48 rounded-lg mb-6"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Subscription Details</h1>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Subscription Details</h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">You don&apos;t have an active subscription yet.</p>
          <Link
            href="/pricing"
            className="inline-block py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  // Determine subscription status and display appropriate message/UI
  const isPremium = subscription.plan.plan_code !== 'free';
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isCancelled = subscription.cancel_at_period_end;
  const isTrialing = subscription.status === 'trialing';
  
  // Format subscription end date
  const endDate = subscription.formattedDates?.currentPeriodEnd;
  
  // Get progress on daily test limit for free users
  const testLimit = subscription.plan.test_limit_daily || 0;
  const testsUsed = subscription.tests_used_today || 0;
  const testLimitPercentage = testLimit > 0 ? (testsUsed / testLimit) * 100 : 0;

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Subscription Details</h1>
      <Suspense fallback={<div className="text-gray-900 dark:text-white">Loading...</div>}>
        <SearchParamsWrapper>
          
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{subscription.plan.plan_name}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">{subscription.plan.description}</p>
              
              <div className="flex items-center mt-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatAmountForDisplay(subscription.plan.price_inr)}
                </span>
                {isPremium && (
                  <span className="text-gray-600 dark:text-gray-300 ml-2">
                    /{subscription.plan.duration_days === 30 
                      ? 'month' 
                      : subscription.plan.duration_days === 90 
                        ? 'quarter' 
                        : 'year'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Subscription Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="h-6 w-6 mr-2 flex-shrink-0">
                        {isActive ? (
                          isCancelled ? (
                            <AlertCircle className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                          ) : (
                            <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
                          )
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {isActive 
                            ? isTrialing 
                              ? 'Trial Active' 
                              : isCancelled 
                                ? 'Active (Cancelled)' 
                                : 'Active' 
                            : subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </p>
                        {isCancelled && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            Your subscription will end on {endDate}
                          </p>
                        )}
                        {isTrialing && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Your trial ends on {subscription.formattedDates?.trialEnd}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Current Period</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {subscription.formattedDates?.currentPeriodStart} to {endDate}
                        </p>
                      </div>
                    </div>
                    
                    {testLimit > 0 && (
                      <div className="flex items-start">
                        <Clock className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
                        <div className="w-full">
                          <p className="font-medium text-gray-900 dark:text-white">Daily Test Usage</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {testsUsed} of {testLimit} tests used today
                          </p>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                testLimitPercentage > 75 ? 'bg-red-500 dark:bg-red-600' : 'bg-blue-500 dark:bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(testLimitPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Plan Features</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                      <span className="text-gray-800 dark:text-gray-200">
                        {subscription.plan.test_limit_daily === null 
                          ? 'Unlimited tests per day' 
                          : `${subscription.plan.test_limit_daily} tests per day`}
                      </span>
                    </li>
                    
                    {(subscription.plan.features || []).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-800 dark:text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Cancellation Details Section */}
              {isPremium && isCancelled && (
                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-300 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Subscription Cancellation
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <CalendarFull className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">Cancellation Date</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {subscription.formattedDates?.canceledAt || 'Not available'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">Service Until</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{endDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      Your subscription has been cancelled but will remain active until the end of the current billing period.
                      You will continue to have full access to all premium features until {endDate}.
                    </p>
                    
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={portalLoading}
                      className="py-2 px-4 bg-yellow-600 text-white rounded font-medium hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 flex items-center"
                    >
                      {portalLoading ? (
                        <span>Loading...</span>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>Reactivate Subscription</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="mt-8">
                {isPremium && subscription.stripe_customer_id && (
                  <button
                    onClick={handleOpenCustomerPortal}
                    disabled={portalLoading}
                    className="py-3 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 flex items-center"
                  >
                    {portalLoading ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        <span>Manage Subscription in Stripe</span>
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </button>
                )}
                
                {!isPremium && (
                  <Link
                    href="/pricing"
                    className="py-3 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 inline-flex items-center">
                    <span>Upgrade to Premium</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* Payment History */}
          {isPremium && paymentHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment History</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.payment_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatAmountForDisplay(payment.amount_inr)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                            {payment.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {payment.receipt_url ? (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                            >
                              View
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SearchParamsWrapper>
      </Suspense>
    </div>
  );
}