// src/components/subscription/SubscriptionStatusBar.tsx
import React from 'react';
import Link from 'next/link';
import useSubscription from '@/hooks/useSubscription';
import { LockOpen, Lock, Clock } from 'lucide-react';

interface SubscriptionStatusBarProps {
  hideOnPremium?: boolean;
  variant?: 'default' | 'compact' | 'full';
  className?: string;
}

const SubscriptionStatusBar: React.FC<SubscriptionStatusBarProps> = ({
  hideOnPremium = false,
  variant = 'default',
  className = ''
}) => {
  const { isPremium, maxTopicsPerSubject, remainingTests, maxTestsPerDay } = useSubscription();
  
  // Don't show for premium users if hideOnPremium is true
  if (hideOnPremium && isPremium) {
    return null;
  }
  
  // Different styles based on variant
  const containerClasses = {
    default: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 py-3 px-4 rounded-lg border border-blue-100 dark:border-blue-900/40',
    compact: 'bg-blue-50 dark:bg-blue-900/20 py-2 px-3 rounded-md border border-blue-100 dark:border-blue-800/40',
    full: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/40 shadow-sm'
  }[variant];
  
  const premiumStatusBar = (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-3">
            <LockOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Premium Account
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Unlimited access to all features
            </div>
          </div>
        </div>
        {variant === 'full' && (
          <Link href="/dashboard/subscription" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            Manage Subscription
          </Link>
        )}
      </div>
    </div>
  );
  
  const freeStatusBar = (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-3">
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Free Account
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              <span>{maxTopicsPerSubject} topics per subject</span>
              {variant !== 'compact' && (
                <span className="mx-1">•</span>
              )}
              {variant === 'compact' ? (
                <div className="mt-0.5">
                  <Clock className="inline h-3 w-3 mr-0.5" />
                  <span>{remainingTests}/{maxTestsPerDay} tests today</span>
                </div>
              ) : (
                <span>{remainingTests} of {maxTestsPerDay} tests remaining today</span>
              )}
            </div>
          </div>
        </div>
        <Link 
          href="/pricing" 
          className="text-xs px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors"
        >
          Upgrade
        </Link>
      </div>
      
      {variant === 'full' && (
        <div className="mt-3 flex justify-between items-center">
          <div className="w-full">
            <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 mb-1">
              <span>Tests remaining today</span>
              <span>{remainingTests}/{maxTestsPerDay}</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" 
                style={{ width: `${(remainingTests / (maxTestsPerDay ?? 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  return isPremium ? premiumStatusBar : freeStatusBar;
};

export default SubscriptionStatusBar;