/**
 * Performance monitoring utilities for tracking page performance
 * and database query times
 */

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Query performance tracker for monitoring slow queries
 */
export class QueryPerformanceTracker {
  private static queries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }> = [];

  static track(query: string, duration: number) {
    this.queries.push({
      query: query.substring(0, 100), // Truncate long queries
      duration,
      timestamp: new Date(),
    });

    // Keep only last 100 queries in memory
    if (this.queries.length > 100) {
      this.queries.shift();
    }

    // Warn about slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected (${duration.toFixed(2)}ms):`, query.substring(0, 200));
    }
  }

  static getStats() {
    if (this.queries.length === 0) {
      return null;
    }

    const durations = this.queries.map(q => q.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    return {
      totalQueries: this.queries.length,
      avgDuration: avg.toFixed(2),
      maxDuration: max.toFixed(2),
      minDuration: min.toFixed(2),
      slowQueries: this.queries.filter(q => q.duration > 1000).length,
    };
  }

  static getSlowestQueries(limit = 10) {
    return [...this.queries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  static clear() {
    this.queries = [];
  }
}

/**
 * Wrapper for database queries with performance tracking
 */
export async function trackedQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    QueryPerformanceTracker.track(queryName, duration);

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    QueryPerformanceTracker.track(`${queryName} (FAILED)`, duration);
    throw error;
  }
}

/**
 * Cache performance metrics
 */
export class CacheMetrics {
  private static hits = 0;
  private static misses = 0;
  private static errors = 0;

  static recordHit() {
    this.hits++;
  }

  static recordMiss() {
    this.misses++;
  }

  static recordError() {
    this.errors++;
  }

  static getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      total,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  static reset() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }
}

/**
 * Simple performance logger for Server Components
 */
export function logPerformance(label: string, startTime: number) {
  const duration = performance.now() - startTime;

  if (process.env.NODE_ENV === 'development') {
    const emoji = duration < 100 ? '⚡' : duration < 500 ? '🐎' : duration < 1000 ? '🐌' : '🦥';
    console.log(`${emoji} ${label}: ${duration.toFixed(2)}ms`);
  }

  return duration;
}

/**
 * Web Vitals reporter for client-side performance
 * Use with Next.js custom App component
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  label: string;
  value: number;
}) {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: Math.round(metric.value),
      label: metric.label,
    });
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // You can send to Google Analytics, Vercel Analytics, etc.
    // Example for Google Analytics:
    interface WindowWithGtag extends Window {
      gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
    }

    if (typeof window !== 'undefined') {
      const gtag = (window as WindowWithGtag).gtag;
      if (gtag) {
        gtag('event', metric.name, {
          value: Math.round(metric.value),
          event_label: metric.id,
          non_interaction: true,
        });
      }
    }
  }
}

/**
 * Middleware timing helper
 */
export function createTimingHeader(operations: Record<string, number>) {
  const parts = Object.entries(operations).map(
    ([name, duration]) => `${name};dur=${duration.toFixed(0)}`
  );
  return parts.join(', ');
}
