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
    
    // Check if limit reached
    if ((subscription.tests_used_today ?? 0) >= plan.test_limit_daily) {
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
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
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
  // Update for the updateSubscriptionFromStripe method in SubscriptionService.ts

/**
 * Update subscription status from Stripe webhook
 */
async updateSubscriptionFromStripe(stripeSubscriptionId: string, userId?: string) {
  try {
    const stripeSubscription = await getSubscriptionFromStripe(stripeSubscriptionId);
    
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
    
    // Use type assertion to access timestamp properties
    // This is needed because TypeScript's type definitions for Stripe might not
    // properly expose all properties that are actually returned by the API
    const currentPeriodStart = (stripeSubscription as any).current_period_start;
    const currentPeriodEnd = (stripeSubscription as any).current_period_end;
    const cancelAtPeriodEnd = (stripeSubscription as any).cancel_at_period_end || false;
    const canceledAt = (stripeSubscription as any).canceled_at;
    
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
    receiptUrl: string;
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
}

export const subscriptionService = new SubscriptionService();
