//File: src/app/api/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { user_subscriptions, subscription_plans } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    // Get userId from auth or query params
    const { userId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get('userId');
    
    // Safety check: only allow requesting your own subscription data
    if (!userId || (requestedUserId && requestedUserId !== userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Define cache key
    const cacheKey = `api:subscription:user:${userId}`;
    
    // Try to get from cache first
    let subscriptionData = await cache.get(cacheKey);
    let source = 'cache';
    
    // If not in cache, fetch from database
    if (!subscriptionData) {
      // Get user subscription
      const userSubscriptions = await db
        .select()
        .from(user_subscriptions)
        .where(eq(user_subscriptions.user_id, userId))
        .limit(1);
      
      // If no subscription exists, return default free data
      if (userSubscriptions.length === 0) {
        // This would normally call createDefaultSubscription, but for now just return default data
        subscriptionData = {
          isPremium: false,
          maxTopicsPerSubject: 2,
          maxTestsPerDay: 3,
          remainingTests: 3,
          planName: 'Free',
          planCode: 'free',
          expiresAt: null
        };
      } else {
        const subscription = userSubscriptions[0];
        
        // Get the plan details
        const plans = await db
          .select()
          .from(subscription_plans)
          .where(eq(subscription_plans.plan_id, subscription.plan_id))
          .limit(1);
        
        if (plans.length === 0) {
          throw new Error(`Plan with ID ${subscription.plan_id} not found`);
        }
        
        const plan = plans[0];
        
        // Calculate remaining tests
        const remainingTests = plan.test_limit_daily 
          ? Math.max(0, plan.test_limit_daily - (subscription.tests_used_today || 0))
          : Infinity;
        
        // Format the subscription data
        subscriptionData = {
          isPremium: plan.plan_code === 'premium',
          maxTopicsPerSubject: plan.plan_code === 'premium' ? Infinity : 2,
          maxTestsPerDay: plan.test_limit_daily || Infinity,
          remainingTests: remainingTests,
          planName: plan.plan_name,
          planCode: plan.plan_code,
          expiresAt: subscription.current_period_end
        };
      }
      
      // Cache for 5 minutes (300 seconds)
      await cache.set(cacheKey, subscriptionData, 300);
      source = 'database';
    }
    
    return NextResponse.json({
      success: true,
      data: subscriptionData,
      source
    });
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscription data',
        details: String(error)
      },
      { status: 500 }
    );
  }
}