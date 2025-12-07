/**
 * React hook for scheduling work to avoid long main-thread tasks
 * Uses scheduler.yield() when available, or falls back to setTimeout
 *
 * This helps break up expensive operations into smaller chunks
 * that don't block the main thread for more than 50ms
 */

import { useCallback } from 'react';

// Type definition for scheduler API (not yet in TypeScript types)
interface SchedulerYield {
  yield?: () => Promise<void>;
}

declare global {
  interface Window {
    scheduler?: SchedulerYield;
  }
}

/**
 * Yields control back to the browser to prevent blocking the main thread
 * Uses the Scheduler API when available, falls back to setTimeout
 */
const yieldToMain = (): Promise<void> => {
  if (typeof window !== 'undefined' && 'scheduler' in window && window.scheduler?.yield) {
    return window.scheduler.yield();
  }

  // Fallback to setTimeout for browsers without scheduler API
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

/**
 * Hook that provides a function to break up expensive operations
 *
 * Example usage:
 * ```tsx
 * const scheduleWork = useScheduler();
 *
 * const processLargeArray = async (items: any[]) => {
 *   for (let i = 0; i < items.length; i++) {
 *     // Do some work
 *     processItem(items[i]);
 *
 *     // Yield to main thread every 50 items
 *     if (i % 50 === 0) {
 *       await scheduleWork();
 *     }
 *   }
 * };
 * ```
 */
export function useScheduler() {
  return useCallback(() => yieldToMain(), []);
}

/**
 * Utility function to chunk an array and process it with yielding
 * This prevents long tasks by breaking work into smaller pieces
 *
 * @param items - Array of items to process
 * @param processItem - Function to process each item
 * @param chunkSize - Number of items to process before yielding (default: 50)
 */
export async function processInChunks<T>(
  items: T[],
  processItem: (item: T, index: number) => void | Promise<void>,
  chunkSize: number = 50
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    await processItem(items[i], i);

    // Yield to main thread after processing chunk
    if ((i + 1) % chunkSize === 0) {
      await yieldToMain();
    }
  }
}
