// src/lib/services/SubscriptionService.ts
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/db';
import { 
  subscription_plans, 
  user_subscriptions, 
  payment_history,
  subscriptionStatusEnum
} from '@/db/schema';
import { withCache, cache } from '@/lib/cache';
import { CacheInvalidator } from '@/lib/cacheInvalidation';
import { getSubscriptionFromStripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { addDays } from 'date-fns';
import { GSTDetails } from '@/types/payment';

// Define type for subscription to match your schema
type UserSubscription = typeof user_subscriptions.$inferSelect;
type SubscriptionPlan = typeof subscription_plans.$inferSelect;

export class SubscriptionService {
  /**
   * Get user's current subscription with improved caching and error handling
   */
  async getUserSubscription(userId: string): Promise<UserSubscription> {
    const cacheKey = `user:${userId}:subscription`;
    
    try {
      // First check memory cache which is super fast
      const cachedData = await cache.get<UserSubscription>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // If not in cache, query database with timeout protection
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<UserSubscription>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Database query timeout'));
        }, 3000); // 3 second timeout
      });
      
      // Database query
      const dbQueryPromise = async (): Promise<UserSubscription> => {
        const subs = await db
          .select()
          .from(user_subscriptions)
          .where(eq(user_subscriptions.user_id, userId))
          .limit(1);
        
        if (subs.length === 0) {
          return this.createDefaultSubscription(userId);
        }
        
        return subs[0];
      };
      
      // Race the query against the timeout
      const subscription = await Promise.race([dbQueryPromise(), timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);
      
      // Cache the successful result for 15 minutes
      await cache.set(cacheKey, subscription, 900);
      
      return subscription;
    } catch (error) {
      console.error(`Error fetching subscription for user ${userId}:`, error);
      
      // Try to get possibly stale data from cache as fallback
      const staleData = await cache.get<UserSubscription>(cacheKey);
      if (staleData) {
        console.log(`Using stale cached subscription data for user ${userId}`);
        return staleData;
      }
      
      // If no cached data, create a temporary subscription object
      console.log(`Creating temporary subscription for user ${userId} due to error`);
      
      // But don't update the database on error, just return a temporary object
      const freePlan = await this.getFreePlan();
      const now = new Date();
      
      // Create a fallback subscription with all required fields
      const fallbackSubscription: UserSubscription = {
        subscription_id: 0,
        user_id: userId,
        plan_id: freePlan.plan_id,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        status: 'active', 
        current_period_start: now,
        current_period_end: addDays(now, 30),
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        tests_used_today: 0,
        tests_used_total: 0,
        last_test_date: null,
        metadata: null,
        created_at: now,
        updated_at: now
      };
      
      return fallbackSubscription;
    }
  }

  /**
   * Helper method to get the free plan
   */
  private async getFreePlan(): Promise<SubscriptionPlan> {
    const cacheKey = 'plan:free';
    
    return withCache<SubscriptionPlan, []>(
      async () => {
        const freePlans = await db
          .select()
          .from(subscription_plans)
          .where(and(
            eq(subscription_plans.plan_code, 'free'),
            eq(subscription_plans.is_active, true)
          ))
          .limit(1);
        
        if (freePlans.length === 0) {
          // Create a default fallback plan if none is found
          return {
            plan_id: 1,
            plan_name: 'Free Plan',
            plan_code: 'free',
            description: 'Default free plan (fallback)',
            price_inr: 0,
            price_id_stripe: 'free_tier',
            product_id_stripe: 'free_product',
            features: null,
            test_limit_daily: 3,
            duration_days: 365,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
        }
        
        return freePlans[0];
      },
      cacheKey,
      3600 // Cache free plan for 1 hour
    )();
  }

  /**
   * Create a default free subscription for a new user
   */
  async createDefaultSubscription(userId: string): Promise<UserSubscription> {
    try {
      // Get the free plan
      const freePlan = await this.getFreePlan();
      
      // Create subscription record
      const now = new Date();
      const endDate = addDays(now, freePlan.duration_days || 365); // Default to 1 year for free plan
      
      const newSubscription = {
        user_id: userId,
        plan_id: freePlan.plan_id,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        status: 'active' as const,
        current_period_start: now,
        current_period_end: endDate,
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        tests_used_today: 0,
        tests_used_total: 0,
        last_test_date: null,
        metadata: null
      };
      
      const [subscription] = await db.insert(user_subscriptions)
        .values(newSubscription)
        .returning();
      
      await CacheInvalidator.invalidateUserSubscription(userId);
      
      return subscription;
    } catch (error) {
      console.error(`Error creating default subscription for user ${userId}:`, error);
      
      // Create a fallback subscription object that won't be saved to the database
      const freePlan = await this.getFreePlan();
      const now = new Date();
      
      // Return a properly structured object that matches the UserSubscription type
      return {
        subscription_id: 0,
        user_id: userId,
        plan_id: freePlan.plan_id,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        status: 'active',
        current_period_start: now, 
        current_period_end: addDays(now, 365),
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        tests_used_today: 0,
        tests_used_total: 0,
        last_test_date: null,
        metadata: null,
        created_at: now,
        updated_at: now
      };
    }
  }

  /**
   * Check if user can take a test
   */
  async canUserTakeTest(userId: string): Promise<{ canTake: boolean; reason?: string }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      // First check if subscription is active
      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        return { 
          canTake: false, 
          reason: 'Your subscription is not active. Please renew your subscription to continue.' 
        };
      }
      
      // For premium plans with unlimited tests
      const plan = await this.getPlanById(subscription.plan_id);
      if (!plan.test_limit_daily) {
        return { canTake: true };
      }
      
      // For plans with daily limits, check usage
      // Reset counter if it's a new day
      await this.resetDailyCounterIfNeeded(userId, subscription);
      
      // Get updated subscription after potential reset
      const updatedSubscription = await this.getUserSubscription(userId);
      
      // Check if limit reached
      if ((updatedSubscription.tests_used_today ?? 0) >= plan.test_limit_daily) {
        return {
          canTake: false,
          reason: `You've reached your daily limit of ${plan.test_limit_daily} tests. Upgrade to premium for unlimited tests.`
        };
      }
      
      return { canTake: true };
    } catch (error) {
      console.error(`Error checking if user ${userId} can take test:`, error);
      
      // Default to allowing the user to take tests if we can't determine otherwise
      // This ensures service degradation is graceful
      return { canTake: true };
    }
  }

  /**
   * Reset daily test counter if it's a new day
   */
  private async resetDailyCounterIfNeeded(userId: string, subscription: UserSubscription) {
    try {
      const today = new Date();
      const lastTestDate = subscription.last_test_date;
      
      // If no tests taken or last test was on a different day, reset counter
      if (!lastTestDate || !this.isSameDay(lastTestDate, today)) {
        await db.update(user_subscriptions)
          .set({ tests_used_today: 0 })
          .where(eq(user_subscriptions.user_id, userId));
        
        await CacheInvalidator.invalidateUserSubscription(userId);
      }
    } catch (error) {
      console.error(`Error resetting counter for user ${userId}:`, error);
      // Just log the error, don't throw - allow the operation to continue
    }
  }

  /**
   * Check if two dates are on the same day
   * Safe handling for various date formats from the database
   */
  private isSameDay(date1: Date | string | number | null | undefined, date2: Date): boolean {
    if (!date1) return false;
    
    try {
      // Convert to Date object if it's not already
      const d1 = date1 instanceof Date ? date1 : new Date(date1);
      
      return d1.getFullYear() === date2.getFullYear() &&
             d1.getMonth() === date2.getMonth() &&
             d1.getDate() === date2.getDate();
    } catch (error) {
      console.error('Error comparing dates:', error);
      return false;
    }
  }

  /**
   * Increment test count when user takes a test
   */
  async incrementTestCount(userId: string): Promise<void> {
    try {
      const today = new Date();
      
      await db.update(user_subscriptions)
        .set({ 
          tests_used_today: sql`${user_subscriptions.tests_used_today} + 1`,
          tests_used_total: sql`${user_subscriptions.tests_used_total} + 1`,
          last_test_date: today,
          updated_at: today
        })
        .where(eq(user_subscriptions.user_id, userId));
      
      await CacheInvalidator.invalidateUserSubscription(userId);
    } catch (error) {
      console.error(`Error incrementing test count for user ${userId}:`, error);
      // Log error but don't throw - this should not block the user experience
    }
  }

  /**
   * Get subscription plan by ID
   */
  async getPlanById(planId: number): Promise<SubscriptionPlan> {
    const cacheKey = `plan:${planId}`;
    
    return withCache<SubscriptionPlan, [number]>(
      async (id: number) => {
        const plans = await db
          .select()
          .from(subscription_plans)
          .where(eq(subscription_plans.plan_id, id))
          .limit(1);
        
        if (plans.length === 0) {
          // Return a fallback plan if not found
          return {
            plan_id: id,
            plan_name: 'Unknown Plan',
            plan_code: 'free',
            description: 'Default fallback plan',
            price_inr: 0,
            price_id_stripe: 'unknown',
            product_id_stripe: 'unknown',
            features: null,
            test_limit_daily: 3,
            duration_days: 365,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
        }
        
        return plans[0];
      },
      cacheKey,
      3600 // 1 hour TTL
    )(planId);
  }

  /**
   * Get all active subscription plans
   */
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    const cacheKey = 'subscription:active-plans';
    
    return withCache<SubscriptionPlan[], []>(
      async () => {
        return db
          .select()
          .from(subscription_plans)
          .where(eq(subscription_plans.is_active, true))
          .orderBy(subscription_plans.price_inr);
      },
      cacheKey,
      3600 // 1 hour TTL
    )();
  }

  /**
   * Check if a user has a premium subscription
   */
  async isPremiumUser(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const plan = await this.getPlanById(subscription.plan_id);
      
      return plan.plan_code === 'premium';
    } catch (error) {
      console.error(`Error checking premium status for user ${userId}:`, error);
      return false; // Default to non-premium on error
    }
  }

  // Other methods from your original SubscriptionService class...
}

export const subscriptionService = new SubscriptionService();