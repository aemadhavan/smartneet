/**
 * Performance monitoring utilities for tracking long tasks and core web vitals
 * Helps identify performance bottlenecks in production
 */

// Performance entry types for long tasks
interface PerformanceLongTaskTiming extends PerformanceEntry {
  attribution?: Array<{
    name: string;
    entryType: string;
    startTime: number;
    duration: number;
    containerType: string;
    containerSrc: string;
    containerId: string;
    containerName: string;
  }>;
}

/**
 * Monitor long tasks (tasks that block the main thread for >50ms)
 * Only runs in browser and when PerformanceObserver is available
 */
export function monitorLongTasks(callback?: (entry: PerformanceLongTaskTiming) => void) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return null;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceLongTaskTiming[]) {
        // Log long task for debugging
        if (process.env.NODE_ENV === 'development') {
          console.warn('Long task detected:', {
            duration: `${entry.duration.toFixed(2)}ms`,
            startTime: `${entry.startTime.toFixed(2)}ms`,
            name: entry.name,
            attribution: entry.attribution,
          });
        }

        // Call custom callback if provided
        callback?.(entry);

        // Send to analytics in production (e.g., Sentry, Vercel Analytics)
        if (process.env.NODE_ENV === 'production') {
          // You can send this to your analytics service
          // Example: sendToAnalytics('long-task', { duration: entry.duration });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    return observer;
  } catch (error) {
    console.error('Failed to initialize long task monitoring:', error);
    return null;
  }
}

/**
 * Track Total Blocking Time (TBT) - sum of blocking time for all long tasks
 * This is a key metric for measuring main thread responsiveness
 */
export function trackTotalBlockingTime(): { getTBT: () => number; stop: () => void } | null {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return null;
  }

  let totalBlockingTime = 0;
  const LONG_TASK_THRESHOLD = 50; // Tasks over 50ms are considered "long"

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count the blocking portion (time over 50ms)
        const blockingTime = Math.max(0, entry.duration - LONG_TASK_THRESHOLD);
        totalBlockingTime += blockingTime;
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    return {
      getTBT: () => totalBlockingTime,
      stop: () => observer.disconnect(),
    };
  } catch (error) {
    console.error('Failed to track TBT:', error);
    return null;
  }
}

/**
 * Measure INP (Interaction to Next Paint) - experimental
 * This tracks how quickly the page responds to user interactions
 */
export function trackInteractionLatency() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return null;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log slow interactions in development
        if (process.env.NODE_ENV === 'development' && entry.duration > 100) {
          console.warn('Slow interaction detected:', {
            duration: `${entry.duration.toFixed(2)}ms`,
            type: entry.entryType,
            name: entry.name,
          });
        }
      }
    });

    // Observe event timing (for INP tracking)
    observer.observe({ entryTypes: ['event'] });
    return observer;
  } catch {
    // Event timing might not be supported in all browsers
    return null;
  }
}

/**
 * Initialize all performance monitoring
 * Call this once in your app initialization
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Monitor long tasks
  const longTaskObserver = monitorLongTasks();

  // Track TBT
  const tbtTracker = trackTotalBlockingTime();

  // Log TBT after 10 seconds
  if (tbtTracker) {
    setTimeout(() => {
      const tbt = tbtTracker.getTBT();
      if (process.env.NODE_ENV === 'development') {
        console.log(`Total Blocking Time: ${tbt.toFixed(2)}ms`);
      }
      // Send to analytics if needed
    }, 10000);
  }

  // Track interaction latency
  const interactionObserver = trackInteractionLatency();

  // Cleanup function
  return () => {
    longTaskObserver?.disconnect();
    tbtTracker?.stop();
    interactionObserver?.disconnect();
  };
}
