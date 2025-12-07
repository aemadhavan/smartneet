'use client';

/**
 * BfcacheHandler - Handles back/forward cache (bfcache) restoration
 *
 * This component:
 * 1. Detects when the page is restored from bfcache
 * 2. Refreshes stale data when needed
 * 3. Handles proper cleanup to enable bfcache eligibility
 */

import { useEffect } from 'react';

export default function BfcacheHandler() {
  useEffect(() => {
    // Handle bfcache restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache
        // Refresh any stale data here
        console.log('[bfcache] Page restored from cache');

        // Trigger data refresh for SWR
        if (typeof window !== 'undefined' && 'swr' in window) {
          // SWR will automatically revalidate on focus
          window.dispatchEvent(new Event('focus'));
        }

        // For custom data fetching hooks that don't use SWR
        window.dispatchEvent(new CustomEvent('bfcache-restore'));
      }
    };

    // Handle page hide - cleanup before entering bfcache
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page is entering bfcache
        console.log('[bfcache] Page entering cache');

        // Cancel any pending fetch requests
        // Note: This doesn't cancel WebSocket connections (Clerk)
        // which is why we still get the WebSocket bfcache warning
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
