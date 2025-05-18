// src/lib/services/SubscriptionService.ts
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/db';
import { 
  subscription_plans, 
  user_subscriptions, 
  payment_history,
  subscriptionStatusEnum
} from '@/db/schema';
import { withCache } from '@/lib/cache';
import { CacheInvalidator } from '@/lib/cacheInvalidation';
import { getSubscriptionFromStripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { addDays } from 'date-fns';
import { GSTDetails } from '@/types/payment';

export class SubscriptionService {
  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string) {
    const cacheKey = `user:${userId}:subscription`;

    return withCache(
      async (uid: string) => {
        const subs = await db
          .select()
          .from(user_subscriptions)
          .where(eq(user_subscriptions.user_id, uid))
          .limit(1);
        
        if (subs.length === 0) {
          return this.createDefaultSubscription(uid);
        }
        
        return subs[0];
      },
      cacheKey,
      300 // 5 minutes TTL
    )(userId);
  }

  /**
   * Create a default free subscription for a new user
   */
  async createDefaultSubscription(userId: string) {
    // Get the free plan
    const freePlans = await db
      .select()
      .from(subscription_plans)
      .where(and(
        eq(subscription_plans.plan_code, 'free'),
        eq(subscription_plans.is_active, true)
      ))
      .limit(1);
    
    if (freePlans.length === 0) {
      throw new Error('No free plan found in the database');
    }
    
    const freePlan = freePlans[0];
    
    // Create subscription record
    const now = new Date();
    const endDate = addDays(now, freePlan.duration_days || 365000); // Very long duration for free plan
    
    const newSubscription = {
      user_id: userId,
      plan_id: freePlan.plan_id,
      status: 'active' as const,
      current_period_start: now,
      current_period_end: endDate,
      tests_used_today: 0,
      tests_used_total: 0
    };
    
    const [subscription] = await db.insert(user_subscriptions)
      .values(newSubscription)
      .returning();
    
    await CacheInvalidator.invalidateUserSubscription(userId);
    
    return subscription;
  }

  /**
   * Check if user can take a test
   */
  async canUserTakeTest(userId: string): Promise<{ canTake: boolean; reason?: string }> {
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
  }

  /**
   * Reset daily test counter if it's a new day
   */
  private async resetDailyCounterIfNeeded(userId: string, subscription: typeof user_subscriptions.$inferSelect) {
    const today = new Date();
    const lastTestDate = subscription.last_test_date;
    
    // If no tests taken or last test was on a different day, reset counter
    if (!lastTestDate || !this.isSameDay(lastTestDate, today)) {
      await db.update(user_subscriptions)
        .set({ tests_used_today: 0 })
        .where(eq(user_subscriptions.user_id, userId));
      
      await CacheInvalidator.invalidateUserSubscription(userId);
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
  }

  /**
   * Get subscription plan by ID
   */
  async getPlanById(planId: number) {
    const cacheKey = `plan:${planId}`;
    
    return withCache(
      async (id: number) => {
        const plans = await db
          .select()
          .from(subscription_plans)
          .where(eq(subscription_plans.plan_id, id))
          .limit(1);
        
        if (plans.length === 0) {
          throw new Error(`Plan with ID ${id} not found`);
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
  async getActivePlans() {
    const cacheKey = 'subscription:active-plans';
    
    return withCache(
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
   * Update subscription status from Stripe webhook
   */
  async updateSubscriptionFromStripe(stripeSubscriptionId: string, userId?: string) {
    try {
      const stripeSubscription = await getSubscriptionFromStripe(stripeSubscriptionId) as Stripe.Subscription;
      
      // Find the user subscription
      let userQuery = db
        .select()
        .from(user_subscriptions)
        .where(eq(user_subscriptions.stripe_subscription_id, stripeSubscriptionId))
        .limit(1);
      
      if (userId) {
        userQuery = db
          .select()
          .from(user_subscriptions)
          .where(and(
            eq(user_subscriptions.user_id, userId),
            eq(user_subscriptions.stripe_subscription_id, stripeSubscriptionId)
          ))
          .limit(1);
      }
      
      const subscriptions = await userQuery;
      
      if (subscriptions.length === 0) {
        console.error(`No subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
        return null;
      }
      
      const subscription = subscriptions[0];
      
      // Map Stripe status to our enum
      let status: typeof subscriptionStatusEnum.enumValues[number] = 'active';
      
      switch (stripeSubscription.status) {
        case 'active':
          status = 'active';
          break;
        case 'canceled':
          status = 'canceled';
          break;
        case 'past_due':
          status = 'past_due';
          break;
        case 'unpaid':
          status = 'unpaid';
          break;
        case 'trialing':
          status = 'trialing';
          break;
        case 'incomplete':
          status = 'incomplete';
          break;
        case 'incomplete_expired':
          status = 'incomplete_expired';
          break;
        default:
          console.warn(`Unknown Stripe subscription status: ${stripeSubscription.status}`);
      }
      
      // Access values from the Stripe subscription object
      // The Stripe API response has these properties but the TypeScript types are sometimes lagging behind
      // We need to use a type assertion to access these timestamp properties
      const stripeData = stripeSubscription as unknown as {
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
        canceled_at: number | null;
      };
      
      const currentPeriodStart = stripeData.current_period_start;
      const currentPeriodEnd = stripeData.current_period_end;
      const cancelAtPeriodEnd = stripeData.cancel_at_period_end || false;
      const canceledAt = stripeData.canceled_at;
      
      // Update subscription in our database
      await db.update(user_subscriptions)
        .set({
          status,
          current_period_start: new Date(currentPeriodStart * 1000),
          current_period_end: new Date(currentPeriodEnd * 1000),
          cancel_at_period_end: cancelAtPeriodEnd,
          canceled_at: canceledAt ? new Date(canceledAt * 1000) : null,
          updated_at: new Date()
        })
        .where(eq(user_subscriptions.subscription_id, subscription.subscription_id));
      
      await CacheInvalidator.invalidateUserSubscription(subscription.user_id);
      
      return subscription;
    } catch (error) {
      console.error('Error updating subscription from Stripe:', error);
      throw error;
    }
  }

  /**
   * Create or update a subscription after successful payment
   */
  async createOrUpdateSubscription({
    userId,
    planId,
    stripeSubscriptionId,
    stripeCustomerId,
    status = 'active',
    periodStart,
    periodEnd,
    trialEnd = null
  }: {
    userId: string;
    planId: number;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    status?: typeof subscriptionStatusEnum.enumValues[number];
    periodStart: Date;
    periodEnd: Date;
    trialEnd?: Date | null;
  }) {
    // Check if user already has a subscription
    const existingSubs = await db
      .select()
      .from(user_subscriptions)
      .where(eq(user_subscriptions.user_id, userId))
      .limit(1);
    
    // Update existing subscription
    if (existingSubs.length > 0) {
      const existingSub = existingSubs[0];
      
      await db.update(user_subscriptions)
        .set({
          plan_id: planId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          trial_end: trialEnd,
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: new Date()
        })
        .where(eq(user_subscriptions.subscription_id, existingSub.subscription_id));
      
      await CacheInvalidator.invalidateUserSubscription(userId);
      
      return { subscriptionId: existingSub.subscription_id, isNew: false };
    }
    
    // Create new subscription
    const [newSubscription] = await db.insert(user_subscriptions)
      .values({
        user_id: userId,
        plan_id: planId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        trial_end: trialEnd,
        tests_used_today: 0,
        tests_used_total: 0,
        cancel_at_period_end: false
      })
      .returning();
    
    await CacheInvalidator.invalidateUserSubscription(userId);
    
    return { subscriptionId: newSubscription.subscription_id, isNew: true };
  }

  /**
   * Record a payment in the payment history
   */
  async recordPayment({
    userId,
    subscriptionId,
    amountInr,
    stripePaymentId,
    stripeInvoiceId,
    paymentMethod,
    paymentStatus,
    paymentDate,
    nextBillingDate,
    receiptUrl,
    gstDetails
  }: {
    userId: string;
    subscriptionId: number;
    amountInr: number;
    stripePaymentId: string;
    stripeInvoiceId: string;
    paymentMethod: string;
    paymentStatus: string;
    paymentDate: Date;
    nextBillingDate: Date;
    receiptUrl: string | null;
    gstDetails: GSTDetails;
  }) {
    await db.insert(payment_history)
      .values({
        user_id: userId,
        subscription_id: subscriptionId,
        amount_inr: amountInr,
        stripe_payment_id: stripePaymentId,
        stripe_invoice_id: stripeInvoiceId,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        payment_date: paymentDate,
        next_billing_date: nextBillingDate,
        receipt_url: receiptUrl,
        gst_details: gstDetails
      });
  }

  /**
   * Get user's payment history
   */
  async getUserPaymentHistory(userId: string) {
    const cacheKey = `user:${userId}:payments`;
    
    return withCache(
      async (uid: string) => {
        return db
          .select()
          .from(payment_history)
          .where(eq(payment_history.user_id, uid))
          .orderBy(sql`${payment_history.payment_date} DESC`);
      },
      cacheKey,
      300 // 5 minutes TTL
    )(userId);
  }
  /**
 * Check if user can access a topic based on the topic index
 * Free users can only access the first N topics per subject
 */
async canAccessTopic(userId: string, subjectId: number, topicIndex: number): Promise<{ canAccess: boolean; reason?: string }> {
  const MAX_FREE_TOPICS = 2; // Number of free topics per subject
  
  try {
    const subscription = await this.getUserSubscription(userId);
    
    // Get the plan details
    const plan = await this.getPlanById(subscription.plan_id);
    
    // Premium users can access all topics
    if (plan.plan_code === 'premium') {
      return { canAccess: true };
    }
    
    // Free users can only access MAX_FREE_TOPICS per subject
    if (topicIndex < MAX_FREE_TOPICS) {
      return { canAccess: true };
    }
    
    return { 
      canAccess: false, 
      reason: `Free users can only access ${MAX_FREE_TOPICS} topics per subject. Upgrade to premium for unlimited access.`
    };
  } catch (error) {
    console.error('Error checking topic access:', error);
    // Default to allowing access if there's an error checking
    return { canAccess: true };
  }
}
/**
 * Get the total number of topics a user can access per subject
 * This is unlimited for premium users and limited for free users
 */
async getAccessibleTopicsCount(userId: string): Promise<number> {
  const MAX_FREE_TOPICS = 2; // Number of free topics per subject
  
  try {
    const subscription = await this.getUserSubscription(userId);
    const plan = await this.getPlanById(subscription.plan_id);
    
    // Premium users can access unlimited topics
    if (plan.plan_code === 'premium') {
      return Infinity;
    }
    
    // Free users can access MAX_FREE_TOPICS per subject
    return MAX_FREE_TOPICS;
  } catch (error) {
    console.error('Error getting accessible topics count:', error);
    // Default to free plan limit if there's an error
    return MAX_FREE_TOPICS;
  }
}
/**
 * Check if a user has a premium subscription
 * This is a convenience method to quickly check premium status
 */
async isPremiumUser(userId: string): Promise<boolean> {
  const cacheKey = `user:${userId}:is-premium`;
  
  return withCache(
    async (uid: string) => {
      const subscription = await this.getUserSubscription(uid);
      const plan = await this.getPlanById(subscription.plan_id);
      
      return plan.plan_code === 'premium';
    },
    cacheKey,
    300 // 5 minutes TTL
  )(userId);
}
/**
 * Get user subscription details with plan information
 * This combines subscription and plan data in one convenient method
 */
async getSubscriptionWithPlan(userId: string) {
  const cacheKey = `user:${userId}:subscription-with-plan`;
  
  return withCache(
    async (uid: string) => {
      const subscription = await this.getUserSubscription(uid);
      const plan = await this.getPlanById(subscription.plan_id);
      
      return {
        subscription,
        plan,
        isPremium: plan.plan_code === 'premium',
        maxTopicsPerSubject: plan.plan_code === 'premium' ? Infinity : 2,
        maxTestsPerDay: plan.test_limit_daily || Infinity,
        remainingTests: plan.test_limit_daily 
          ? Math.max(0, plan.test_limit_daily - (subscription.tests_used_today || 0))
          : Infinity
      };
    },
    cacheKey,
    300 // 5 minutes TTL
  )(userId);
}

}

export const subscriptionService = new SubscriptionService();