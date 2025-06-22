// src/lib/services/SubmissionQueueService.ts
import { logger } from '@/lib/logger';

export interface PendingSubmission {
  sessionId: number;
  answers: Record<number, string>;
  timingData?: {
    totalSeconds?: number;
    questionTimes?: Record<string, number>;
    averageTimePerQuestion?: number;
  };
  timestamp: number;
  status: 'pending' | 'submitting' | 'failed' | 'completed';
  retryCount?: number;
  lastAttempt?: number;
}

class SubmissionQueueService {
  private readonly STORAGE_KEY_PREFIX = 'pending_submission_';
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly RETRY_DELAY_BASE = 2000; // 2 seconds base delay
  private isProcessing = false;
  private networkStatusListeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  /**
   * Add a submission to the queue
   */
  addToQueue(submission: Omit<PendingSubmission, 'status' | 'retryCount' | 'lastAttempt'>): void {
    try {
      const pendingSubmission: PendingSubmission = {
        ...submission,
        status: 'pending',
        retryCount: 0
      };

      const storageKey = `${this.STORAGE_KEY_PREFIX}${submission.sessionId}`;
      localStorage.setItem(storageKey, JSON.stringify(pendingSubmission));

      logger.info('Added submission to queue', {
        context: 'SubmissionQueueService',
        data: { 
          sessionId: submission.sessionId,
          timestamp: submission.timestamp 
        }
      });

      // Try to process queue immediately if online
      if (navigator.onLine) {
        this.processQueue();
      }
    } catch (error) {
      logger.error('Failed to add submission to queue', {
        context: 'SubmissionQueueService',
        error: error instanceof Error ? error.message : String(error),
        data: { sessionId: submission.sessionId }
      });
    }
  }

  /**
   * Get all pending submissions
   */
  getPendingSubmissions(): PendingSubmission[] {
    const submissions: PendingSubmission[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const submission = JSON.parse(item) as PendingSubmission;
              submissions.push(submission);
            } catch (parseError) {
              logger.warn('Failed to parse queued submission', {
                context: 'SubmissionQueueService',
                error: parseError instanceof Error ? parseError.message : String(parseError),
                data: { key }
              });
              // Remove corrupted entry
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to retrieve pending submissions', {
        context: 'SubmissionQueueService',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return submissions.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Remove a submission from the queue
   */
  removeFromQueue(sessionId: number): void {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${sessionId}`;
      localStorage.removeItem(storageKey);
      
      logger.info('Removed submission from queue', {
        context: 'SubmissionQueueService',
        data: { sessionId }
      });
    } catch (error) {
      logger.error('Failed to remove submission from queue', {
        context: 'SubmissionQueueService',
        error: error instanceof Error ? error.message : String(error),
        data: { sessionId }
      });
    }
  }

  /**
   * Update a submission in the queue
   */
  private updateSubmission(submission: PendingSubmission): void {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${submission.sessionId}`;
      localStorage.setItem(storageKey, JSON.stringify(submission));
    } catch (error) {
      logger.error('Failed to update submission in queue', {
        context: 'SubmissionQueueService',
        error: error instanceof Error ? error.message : String(error),
        data: { sessionId: submission.sessionId }
      });
    }
  }

  /**
   * Process all pending submissions
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    logger.info('Processing submission queue', {
      context: 'SubmissionQueueService'
    });

    try {
      const pendingSubmissions = this.getPendingSubmissions();
      
      if (pendingSubmissions.length === 0) {
        return;
      }

      logger.info(`Found ${pendingSubmissions.length} pending submissions`, {
        context: 'SubmissionQueueService',
        data: { count: pendingSubmissions.length }
      });

      // Process submissions one by one to avoid overwhelming the server
      for (const submission of pendingSubmissions) {
        if (submission.status === 'pending' || 
            (submission.status === 'failed' && this.shouldRetry(submission))) {
          await this.processSubmission(submission);
          
          // Add delay between submissions to be respectful to the server
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      logger.error('Error processing submission queue', {
        context: 'SubmissionQueueService',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single submission
   */
  private async processSubmission(submission: PendingSubmission): Promise<void> {
    try {
      // Update status to submitting
      submission.status = 'submitting';
      submission.lastAttempt = Date.now();
      this.updateSubmission(submission);

      logger.info('Attempting to submit queued submission', {
        context: 'SubmissionQueueService',
        data: { 
          sessionId: submission.sessionId, 
          retryCount: submission.retryCount || 0 
        }
      });

      // Prepare the submission payload
      const submissionPayload = {
        answers: submission.answers,
        timingData: submission.timingData
      };

      // Make the API call
      const response = await fetch(`/api/practice-sessions/${submission.sessionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload),
      });

      const responseData = await response.json();

      if (response.ok || responseData.success) {
        // Success - remove from queue
        submission.status = 'completed';
        this.removeFromQueue(submission.sessionId);
        
        logger.info('Successfully submitted queued submission', {
          context: 'SubmissionQueueService',
          data: { sessionId: submission.sessionId }
        });

        // Notify listeners about successful submission
        this.notifySubmissionComplete(submission.sessionId, true);
      } else {
        throw new Error(responseData.error || 'Failed to submit answers');
      }
    } catch (error) {
      const retryCount = (submission.retryCount || 0) + 1;
      
      logger.error('Failed to submit queued submission', {
        context: 'SubmissionQueueService',
        error: error instanceof Error ? error.message : String(error),
        data: { 
          sessionId: submission.sessionId, 
          retryCount 
        }
      });

      if (retryCount >= this.MAX_RETRY_ATTEMPTS) {
        // Max retries reached - mark as failed permanently
        submission.status = 'failed';
        submission.retryCount = retryCount;
        this.updateSubmission(submission);
        
        logger.warn('Max retry attempts reached for queued submission', {
          context: 'SubmissionQueueService',
          data: { 
            sessionId: submission.sessionId, 
            maxRetries: this.MAX_RETRY_ATTEMPTS 
          }
        });

        // Notify listeners about failed submission
        this.notifySubmissionComplete(submission.sessionId, false);
      } else {
        // Schedule for retry
        submission.status = 'failed';
        submission.retryCount = retryCount;
        this.updateSubmission(submission);
      }
    }
  }

  /**
   * Check if a submission should be retried
   */
  private shouldRetry(submission: PendingSubmission): boolean {
    if (!submission.retryCount || submission.retryCount >= this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    if (!submission.lastAttempt) {
      return true;
    }

    // Exponential backoff - wait longer between retries
    const timeSinceLastAttempt = Date.now() - submission.lastAttempt;
    const minWaitTime = this.RETRY_DELAY_BASE * Math.pow(2, submission.retryCount - 1);
    
    return timeSinceLastAttempt >= minWaitTime;
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    logger.info('Network connection restored', {
      context: 'SubmissionQueueService'
    });

    this.notifyNetworkStatusChange(true);
    
    // Process queue when back online
    setTimeout(() => {
      this.processQueue();
    }, 1000); // Small delay to ensure connection is stable
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    logger.info('Network connection lost', {
      context: 'SubmissionQueueService'
    });

    this.notifyNetworkStatusChange(false);
  }

  /**
   * Add network status listener
   */
  addNetworkStatusListener(callback: (isOnline: boolean) => void): void {
    this.networkStatusListeners.push(callback);
  }

  /**
   * Remove network status listener
   */
  removeNetworkStatusListener(callback: (isOnline: boolean) => void): void {
    const index = this.networkStatusListeners.indexOf(callback);
    if (index > -1) {
      this.networkStatusListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners about network status change
   */
  private notifyNetworkStatusChange(isOnline: boolean): void {
    this.networkStatusListeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        logger.error('Error in network status listener', {
          context: 'SubmissionQueueService',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

  /**
   * Notify about submission completion (placeholder for future extension)
   */
  private notifySubmissionComplete(sessionId: number, success: boolean): void {
    // This could be extended to notify UI components about submission status
    logger.info('Submission completed', {
      context: 'SubmissionQueueService',
      data: { sessionId, success }
    });
  }

  /**
   * Get current network status
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Clear all queued submissions (use with caution)
   */
  clearQueue(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      logger.info('Cleared submission queue', {
        context: 'SubmissionQueueService',
        data: { cleared: keysToRemove.length }
      });
    } catch (error) {
      logger.error('Failed to clear submission queue', {
        context: 'SubmissionQueueService',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Export singleton instance
export const submissionQueueService = new SubmissionQueueService();