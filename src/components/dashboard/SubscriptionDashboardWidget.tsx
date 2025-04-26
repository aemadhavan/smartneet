// src/components/dashboard/SubscriptionDashboardWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Award, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

export default function SubscriptionDashboardWidget() {
  const { 
    limitStatus, 
    subscription, 
    loading, 
    error, 
    refetch 
  } = useSubscriptionLimits();

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Subscription Status</h3>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !subscription || !limitStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Subscription Status</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {error || 'Unable to load subscription information'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const isPremium = subscription.planCode === 'premium';
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className={`p-6 ${isPremium ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-700/30'}`}>
        <div className="flex items-center">
          <div className={`rounded-full p-2 mr-3 ${isPremium ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-200 dark:bg-gray-600'}`}>
            {isPremium ? (
              <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {subscription.planName}
            </h3>
            <div className="flex items-center mt-1">
              {isActive ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Test usage */}
        <div className="mb-5">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Practice Tests</h4>
          
          {limitStatus.isUnlimited ? (
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 mb-2">
              <Award className="h-4 w-4 mr-2" />
              <span className="text-sm">Unlimited tests with your premium plan</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today's tests</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {limitStatus.usedToday} / {limitStatus.limitPerDay}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full ${
                    !limitStatus.canTake 
                      ? 'bg-red-500 dark:bg-red-600' 
                      : limitStatus.usedToday / (limitStatus.limitPerDay || 1) > 0.7
                        ? 'bg-amber-500 dark:bg-amber-600'
                        : 'bg-emerald-500 dark:bg-emerald-600'
                  }`}
                  style={{ 
                    width: `${Math.min(
                      100, 
                      (limitStatus.usedToday / (limitStatus.limitPerDay || 1)) * 100
                    )}%` 
                  }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {limitStatus.canTake
                  ? `${limitStatus.remainingToday} tests remaining today`
                  : limitStatus.reason || "You've reached your daily limit"}
              </p>
            </>
          )}
        </div>
        
        {/* Plan features */}
        <div className="mb-5">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plan Features</h4>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              {isPremium ? 'Unlimited practice tests' : `${limitStatus.limitPerDay} practice tests per day`}
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              {isPremium ? 'Advanced analytics' : 'Basic performance tracking'}
            </li>
            {isPremium && (
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Previous years papers
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
          {isPremium ? (
            <Link href="/dashboard/subscription" className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors">
              Manage Subscription
            </Link>
          ) : (
            <Link href="/pricing" className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors">
              Upgrade to Premium
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}