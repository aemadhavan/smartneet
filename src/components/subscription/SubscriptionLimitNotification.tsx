// src/components/subscription/SubscriptionLimitNotification.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, X } from 'lucide-react';

interface SubscriptionLimitNotificationProps {
  message?: string;
  onDismiss?: () => void;
}

export default function SubscriptionLimitNotification({ 
  message = "You've reached your daily practice limit. Upgrade to Premium for unlimited practice tests.",
  onDismiss 
}: SubscriptionLimitNotificationProps) {
  const [visible, setVisible] = useState(true);

  // Hide the notification after user-initiated dismiss
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  // If not visible, don't render anything
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md w-full bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Test Limit Reached
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              {message}
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Upgrade Now
              </Link>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 focus:outline-none"
              onClick={handleDismiss}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}