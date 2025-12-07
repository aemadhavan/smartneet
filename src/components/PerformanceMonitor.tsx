'use client';

/**
 * Performance monitoring component
 * Initializes performance tracking on mount and cleans up on unmount
 * This component has no visual output - it only monitors performance
 */

import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/utils/performanceMonitor';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    const cleanup = initPerformanceMonitoring();

    // Cleanup on unmount
    return () => {
      cleanup?.();
    };
  }, []);

  // This component renders nothing - it only sets up monitoring
  return null;
}
