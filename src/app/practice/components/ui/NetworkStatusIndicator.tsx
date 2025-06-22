// src/app/practice/components/ui/NetworkStatusIndicator.tsx
'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { submissionQueueService, PendingSubmission } from '@/lib/services/SubmissionQueueService';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initialize network status
    setIsOnline(navigator.onLine);

    // Load pending submissions
    setPendingSubmissions(submissionQueueService.getPendingSubmissions());

    // Listen for network status changes
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online);
      if (online) {
        // Refresh pending submissions when back online
        setTimeout(() => {
          setPendingSubmissions(submissionQueueService.getPendingSubmissions());
        }, 1000);
      }
    };

    submissionQueueService.addNetworkStatusListener(handleNetworkChange);

    // Periodically check for pending submissions
    const intervalId = setInterval(() => {
      setPendingSubmissions(submissionQueueService.getPendingSubmissions());
    }, 5000);

    return () => {
      submissionQueueService.removeNetworkStatusListener(handleNetworkChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleRetryAll = async () => {
    if (isOnline) {
      await submissionQueueService.processQueue();
      setPendingSubmissions(submissionQueueService.getPendingSubmissions());
    }
  };

  if (!isOnline || pendingSubmissions.length > 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div 
          className={`rounded-lg shadow-lg p-3 cursor-pointer transition-all ${
            !isOnline 
              ? 'bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700' 
              : 'bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-700'
          }`}
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
            
            <div className="text-sm">
              {!isOnline ? (
                <span className="text-red-800 dark:text-red-200 font-medium">
                  Offline
                </span>
              ) : (
                <span className="text-amber-800 dark:text-amber-200 font-medium">
                  {pendingSubmissions.length} pending submission{pendingSubmissions.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-current/20">
              {!isOnline ? (
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p>No internet connection detected.</p>
                  <p className="mt-1">Your answers will be saved locally and submitted when connection is restored.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p>Some submissions are pending:</p>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {pendingSubmissions.map((submission) => (
                      <div 
                        key={submission.sessionId}
                        className="flex items-center justify-between text-xs p-2 bg-white/50 dark:bg-gray-800/50 rounded"
                      >
                        <span>Session {submission.sessionId}</span>
                        <div className="flex items-center space-x-1">
                          {submission.status === 'submitting' ? (
                            <div className="w-3 h-3 border border-amber-600 border-t-transparent rounded-full animate-spin" />
                          ) : submission.status === 'failed' ? (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          ) : (
                            <Clock className="h-3 w-3 text-amber-500" />
                          )}
                          <span className="text-amber-700 dark:text-amber-300">
                            {submission.retryCount || 0} retries
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetryAll();
                    }}
                    className="w-full mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded transition-colors"
                  >
                    Retry All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show success indicator briefly when coming back online
  if (isOnline && pendingSubmissions.length === 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2">
            <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200 font-medium">
              Online
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}