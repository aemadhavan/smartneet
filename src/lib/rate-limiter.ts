import { cache } from './cache';

interface RateLimitResult {
  success: boolean;
  remaining?: number;
  retryAfter?: number;
}

export class RateLimiter {
  private key: string;
  private points: number;
  private duration: number;

  constructor(key: string, points: number, duration: number) {
    this.key = `ratelimit:${key}`;
    this.points = points;
    this.duration = duration;
  }

  async consume(): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    
    // Get current count and expiry
    const current = await cache.get<{ count: number, expiry: number }>(this.key);
    
    if (!current) {
      // First request, initialize counter
      await cache.set(this.key, { count: 1, expiry: now + this.duration }, this.duration);
      return { success: true, remaining: this.points - 1 };
    }
    
    if (current.count >= this.points) {
      // Rate limit exceeded
      const retryAfter = current.expiry - now;
      return { 
        success: false, 
        remaining: 0,
        retryAfter: retryAfter > 0 ? retryAfter : 1
      };
    }
    
    // Increment counter
    await cache.set(
      this.key, 
      { count: current.count + 1, expiry: current.expiry },
      current.expiry - now
    );
    
    return { 
      success: true, 
      remaining: this.points - current.count - 1
    };
  }

  async reset(): Promise<void> {
    await cache.delete(this.key);
  }
} 