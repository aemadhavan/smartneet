// src/app/practice/components/ui/ErrorDisplay.tsx
'use client';

import { AlertCircle, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import Link from 'next/link';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  additionalInfo?: string;
  showHomeLink?: boolean;
  isNetworkError?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export function ErrorDisplay({ 
  message, 
  onRetry, 
  additionalInfo,
  showHomeLink = true,
  isNetworkError = false,
  retryCount = 0,
  maxRetries = 3
}: ErrorDisplayProps) {
  return (
    <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className={`p-4 border-b ${
          isNetworkError 
            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800'
            : 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800'
        }`}>
          <div className="flex items-center">
            {isNetworkError ? (
              <WifiOff className="h-6 w-6 text-amber-500 dark:text-amber-400 mr-2" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400 mr-2" />
            )}
            <h2 className={`text-lg font-semibold ${
              isNetworkError 
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-red-800 dark:text-red-300'
            }`}>
              {isNetworkError 
                ? 'Network Connection Issue' 
                : 'Failed to load practice session'
              }
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {message}
          </p>
          
          {isNetworkError && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md mb-4">
              <div className="flex items-start space-x-2">
                <Wifi className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium">Network Connection Tips:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Check your internet connection</li>
                    <li>• Try switching between WiFi and mobile data</li>
                    <li>• Your progress is saved locally and will sync when reconnected</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {retryCount > 0 && (
            <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>
                Attempt {retryCount} of {maxRetries}
                {retryCount >= maxRetries && ' (Max retries reached)'}
              </span>
            </div>
          )}
          
          {additionalInfo && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {additionalInfo}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {onRetry && retryCount < maxRetries && (
              <button
                onClick={onRetry}
                className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center transition-colors ${
                  isNetworkError
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isNetworkError ? 'Retry Connection' : 'Retry'}
              </button>
            )}

            {retryCount >= maxRetries && isNetworkError && (
              <button
                onClick={() => {
                  if (navigator.onLine) {
                    onRetry?.();
                  } else {
                    alert('Please check your internet connection and try again.');
                  }
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Check Connection & Retry
              </button>
            )}
            
            {showHomeLink && (
              <Link
                href="/"
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-center transition-colors"
              >
                Back to Home
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}