// src/app/api/user/subscription/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { cache } from '@/lib/cache';
import { format } from 'date-fns';

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Define cache key
    const cacheKey = `user:${userId}:subscription:details`;
    
    // Try to get from cache first
    let subscriptionData = await cache.get(cacheKey);
    let source = 'cache';
    
    // If not in cache, fetch from database
    if (!subscriptionData) {
      // Get user subscription
      const subscription = await subscriptionService.getUserSubscription(userId);
      
      if (!subscription) {
        return NextResponse.json(
          { error: 'No subscription found' },
          { status: 404 }
        );
      }
      
      // Get plan details
      const plans = await db
        .select()
        .from(subscription_plans)
        .where(eq(subscription_plans.plan_id, subscription.plan_id))
        .limit(1);
      
      const plan = plans.length > 0 ? plans[0] : null;
      
      // Combine subscription with plan details and format dates
      subscriptionData = {
        ...subscription,
        plan,
        formattedDates: {
          currentPeriodStart: subscription.current_period_start 
            ? format(new Date(subscription.current_period_start), 'dd MMMM yyyy')
            : null,
          currentPeriodEnd: subscription.current_period_end 
            ? format(new Date(subscription.current_period_end), 'dd MMMM yyyy')
            : null,
          trialEnd: subscription.trial_end 
            ? format(new Date(subscription.trial_end), 'dd MMMM yyyy')
            : null,
          // Format canceled_at date when available
          canceledAt: subscription.canceled_at 
            ? format(new Date(subscription.canceled_at), 'dd MMMM yyyy')
            : null
        }
      };
      
      // Cache for 5 minutes (300 seconds)
      await cache.set(cacheKey, subscriptionData, 300);
      source = 'database';
    }
    
    return NextResponse.json({ 
      subscription: subscriptionData,
      source
    });
  } catch (error: unknown) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}