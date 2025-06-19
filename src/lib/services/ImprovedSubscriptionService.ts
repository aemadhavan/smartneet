// src/lib/services/ImprovedSubscriptionService.ts
import { db } from '@/db';
import { 
  user_subscriptions, 
  subscription_plans 
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@/db/schema';

interface TestLimitStatus {
  canTake: boolean;
  isUnlimited: boolean;
  usedToday: number;
  limitPerDay: number | null;
  remainingToday: number;
  reason?: string;
}

interface SubscriptionData {
  subscription: typeof user_subscriptions.$inferSelect;
  plan: typeof subscription_plans.$inferSelect;
  limitStatus: TestLimitStatus;
}

type DatabaseTransaction = NodePgDatabase<typeof schema>;

export class ImprovedSubscriptionService {
  private static readonly CACHE_TTL = 120; // 2 minutes
  private static readonly SUBSCRIPTION_LOCK_TTL = 10; // 10 seconds

  /**
   * Get comprehensive subscription data with atomic operations
   */
  async getSubscriptionData(userId: string, forceRefresh = false): Promise<SubscriptionData> {
    const cacheKey = `user:${userId}:subscription-data`;
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = await cache.get<SubscriptionData>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const data = await db.transaction(async (tx) => {
        // Get or create subscription
        let subscription = await this.getOrCreateSubscription(tx, userId);
        
        // Reset daily counter if needed (atomic)
        subscription = await this.resetDailyCounterIfNeeded(tx, subscription);
        
        // Get plan details
        const plan = await this.getPlanDetails(tx, subscription.plan_id);
        
        // Calculate limit status
        const limitStatus = this.calculateLimitStatus(subscription, plan);
        
        return { subscription, plan, limitStatus };
      });

      // Cache the result
      await cache.set(cacheKey, data, ImprovedSubscriptionService.CACHE_TTL);
      
      return data;
    } catch (error) {
      logger.error('Error getting subscription data', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Try to return stale cache data
      const staleData = await cache.get<SubscriptionData>(cacheKey);
      if (staleData) {
        logger.warn('Using stale subscription data', { userId });
        return staleData;
      }
      
      // Return default free subscription
      return this.getDefaultSubscriptionData();
    }
  }

  /**
   * Check if user can take a test with atomic validation
   */
  async canUserTakeTest(userId: string): Promise<{ canTake: boolean; reason?: string }> {
    try {
      const data = await this.getSubscriptionData(userId);
      
      // Check subscription status
      if (!['active', 'trialing'].includes(data.subscription.status)) {
        return {
          canTake: false,
          reason: 'Your subscription is not active. Please renew to continue.'
        };
      }
      
      // Check daily limits
      if (!data.limitStatus.canTake) {
        return {
          canTake: false,
          reason: data.limitStatus.reason || 'Daily test limit reached'
        };
      }
      
      return { canTake: true };
    } catch (error) {
      logger.error('Error checking if user can take test', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Default to allowing tests on error to avoid blocking users
      return { canTake: true };
    }
  }

  /**
   * Atomically increment test count with validation
   */
  async incrementTestCount(userId: string): Promise<{ success: boolean; remaining: number }> {
    const lockKey = `test-increment-lock:${userId}`;
    
    try {
      // Acquire lock to prevent race conditions
      const lockAcquired = await this.acquireLock(lockKey);
      if (!lockAcquired) {
        throw new Error('Test increment already in progress');
      }

      const result = await db.transaction(async (tx) => {
        // Get current subscription with row lock
        const subscriptions = await tx
          .select()
          .from(user_subscriptions)
          .where(eq(user_subscriptions.user_id, userId))
          .for('update'); // Row-level lock

        if (subscriptions.length === 0) {
          throw new Error('Subscription not found');
        }

        const subscription = subscriptions[0];
        
        // Get plan details
        const plans = await tx
          .select()
          .from(subscription_plans)
          .where(eq(subscription_plans.plan_id, subscription.plan_id));

        if (plans.length === 0) {
          throw new Error('Plan not found');
        }

        const plan = plans[0];
        const dailyLimit = plan.test_limit_daily;

        // Check if unlimited
        if (dailyLimit === null) {
          // Unlimited plan - just increment
          await tx
            .update(user_subscriptions)
            .set({
              tests_used_today: sql`${user_subscriptions.tests_used_today} + 1`,
              tests_used_total: sql`${user_subscriptions.tests_used_total} + 1`,
              last_test_date: new Date(),
              updated_at: new Date()
            })
            .where(eq(user_subscriptions.user_id, userId));

          return { success: true, remaining: Number.MAX_SAFE_INTEGER };
        }

        // Limited plan - check and increment
        const currentUsage = subscription.tests_used_today || 0;
        
        if (currentUsage >= dailyLimit) {
          return { success: false, remaining: 0 };
        }

        // Increment usage
        await tx
          .update(user_subscriptions)
          .set({
            tests_used_today: currentUsage + 1,
            tests_used_total: sql`${user_subscriptions.tests_used_total} + 1`,
            last_test_date: new Date(),
            updated_at: new Date()
          })
          .where(eq(user_subscriptions.user_id, userId));

        return { success: true, remaining: dailyLimit - currentUsage - 1 };
      });

      // Invalidate cache
      await this.invalidateUserCache(userId);

      return result;
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Get or create subscription in transaction
   */
  private async getOrCreateSubscription(tx: DatabaseTransaction, userId: string): Promise<typeof user_subscriptions.$inferSelect> {
    // Try to get existing subscription
    const existing = await tx
      .select()
      .from(user_subscriptions)
      .where(eq(user_subscriptions.user_id, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create default free subscription
    const freePlans = await tx
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.plan_code, 'free'))
      .limit(1);

    if (freePlans.length === 0) {
      throw new Error('Free plan not found');
    }

    const freePlan = freePlans[0];
    const now = new Date();
    const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

    const [newSubscription] = await tx
      .insert(user_subscriptions)
      .values({
        user_id: userId,
        plan_id: freePlan.plan_id,
        status: 'active',
        current_period_start: now,
        current_period_end: endDate,
        tests_used_today: 0,
        tests_used_total: 0,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        last_test_date: null,
        metadata: null
      })
      .returning();

    logger.info('Created default subscription', {
      userId,
      subscriptionId: newSubscription.subscription_id,
      planId: freePlan.plan_id
    });

    return newSubscription;
  }

  /**
   * Reset daily counter if it's a new day (atomic)
   */
  private async resetDailyCounterIfNeeded(tx: DatabaseTransaction, subscription: typeof user_subscriptions.$inferSelect): Promise<typeof user_subscriptions.$inferSelect> {
    const now = new Date();
    const lastTestDate = subscription.last_test_date;

    // Check if it's a new day (UTC)
    const shouldReset = !lastTestDate || 
      !this.isSameUTCDay(new Date(lastTestDate), now);

    if (shouldReset && subscription.tests_used_today > 0) {
      // Reset counter
      await tx
        .update(user_subscriptions)
        .set({
          tests_used_today: 0,
          updated_at: now
        })
        .where(eq(user_subscriptions.user_id, subscription.user_id));

      // Return updated subscription
      return {
        ...subscription,
        tests_used_today: 0,
        updated_at: now
      };
    }

    return subscription;
  }

  /**
   * Get plan details in transaction
   */
  private async getPlanDetails(tx: DatabaseTransaction, planId: number): Promise<typeof subscription_plans.$inferSelect> {
    const plans = await tx
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.plan_id, planId))
      .limit(1);

    if (plans.length === 0) {
      // Return default free plan
      return {
        plan_id: planId,
        plan_name: 'Free Plan',
        plan_code: 'free',
        test_limit_daily: 3,
        price_inr: 0,
        price_id_stripe: '',
        product_id_stripe: '',
        features: null,
        duration_days: 365,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
    }

    return plans[0];
  }

  /**
   * Calculate limit status based on subscription and plan
   */
  private calculateLimitStatus(subscription: typeof user_subscriptions.$inferSelect, plan: typeof subscription_plans.$inferSelect): TestLimitStatus {
    const isUnlimited = plan.test_limit_daily === null;
    const usedToday = subscription.tests_used_today || 0;
    const limitPerDay = plan.test_limit_daily || 3;

    if (isUnlimited) {
      return {
        canTake: true,
        isUnlimited: true,
        usedToday,
        limitPerDay: null,
        remainingToday: Number.MAX_SAFE_INTEGER
      };
    }

    const remainingToday = Math.max(0, limitPerDay - usedToday);
    const canTake = remainingToday > 0;

    let reason: string | undefined;
    if (!canTake) {
      const nextReset = this.getNextUTCMidnight();
      const localTime = nextReset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const localDate = nextReset.toLocaleDateString();
      reason = `You've reached your daily limit of ${limitPerDay} tests. You can take more tests after ${localTime} on ${localDate}.`;
    }

    return {
      canTake,
      isUnlimited: false,
      usedToday,
      limitPerDay,
      remainingToday,
      reason
    };
  }

  /**
   * Check if two dates are the same UTC day
   */
  private isSameUTCDay(date1: Date, date2: Date): boolean {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  }

  /**
   * Get next UTC midnight
   */
  private getNextUTCMidnight(): Date {
    const now = new Date();
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
  }

  /**
   * Get default subscription data for errors
   */
  private getDefaultSubscriptionData(): SubscriptionData {
    return {
      subscription: {
        subscription_id: 0,
        user_id: '',
        plan_id: 1,
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(),
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        tests_used_today: 0,
        tests_used_total: 0,
        last_test_date: null,
        metadata: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      plan: {
        plan_id: 1,
        plan_name: 'Free Plan',
        plan_code: 'free',
        test_limit_daily: 3,
        price_inr: 0,
        price_id_stripe: '',
        product_id_stripe: '',
        features: null,
        duration_days: 365,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      limitStatus: {
        canTake: true,
        isUnlimited: false,
        usedToday: 0,
        limitPerDay: 3,
        remainingToday: 3
      }
    };
  }

  /**
   * Acquire lock for atomic operations
   */
  private async acquireLock(lockKey: string): Promise<boolean> {
    try {
      const lockValue = `${Date.now()}-${Math.random()}`;
      await cache.set(lockKey, lockValue, ImprovedSubscriptionService.SUBSCRIPTION_LOCK_TTL);
      
      // Verify we got the lock
      const currentValue = await cache.get(lockKey);
      return currentValue === lockValue;
    } catch (error) {
      logger.error('Failed to acquire subscription lock', {
        lockKey,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Release lock
   */
  private async releaseLock(lockKey: string): Promise<void> {
    try {
      await cache.delete(lockKey);
    } catch {
      logger.warn('Failed to release subscription lock', {
        lockKey
      });
    }
  }

  /**
   * Invalidate user cache
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      `user:${userId}:subscription-data`,
      `user:${userId}:subscription`,
      `user:${userId}:test-limits`
    ];

    for (const key of keys) {
      try {
        await cache.delete(key);
      } catch {
        logger.warn('Failed to invalidate cache', { userId, key });
      }
    }
  }
}

export const improvedSubscriptionService = new ImprovedSubscriptionService();