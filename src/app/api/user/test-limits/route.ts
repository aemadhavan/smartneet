// src/app/api/user/test-limits/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans, user_subscriptions } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { cache } from '@/lib/cache';

// Define types for the response structure
interface LimitStatus {
  canTake: boolean;
  isUnlimited: boolean;
  usedToday: number;
  limitPerDay: number | null;
  remainingToday: number;
  reason: string | null;
}

interface SubscriptionInfo {
  id: number;
  planName: string;
  planCode: string;
  status: string;
  lastTestDate: string | null;
}

interface TestLimitResponse {
  limitStatus: LimitStatus;
  subscription: SubscriptionInfo;
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Get URL to check for cache-busting parameter
    const url = new URL(request.url);
    const skipCache = url.searchParams.has('t');

    // Define cache key for test limit status
    const cacheKey = `user:${userId}:test-limits`;
    
    // Try to get from cache first (short TTL as this changes frequently)
    // Only if skipCache is false
    let response = skipCache ? null : await cache.get<TestLimitResponse>(cacheKey);
    let source = skipCache ? 'forced-refresh' : 'cache';
    
    if (!response) {
      // Get user subscription
      const subscription = await subscriptionService.getUserSubscription(userId);
      
      if (!subscription) {
        return NextResponse.json(
          { error: 'No subscription found' },
          { status: 404 }
        );
      }
      
      // Get subscription plan
      const plans = await db
        .select()
        .from(subscription_plans)
        .where(eq(subscription_plans.plan_id, subscription.plan_id))
        .limit(1);
      
      const plan = plans.length > 0 ? plans[0] : null;
      
      if (!plan) {
        return NextResponse.json(
          { error: 'Subscription plan not found' },
          { status: 404 }
        );
      }
      
      try {
        // Check if user can take a test
        const { canTake, reason } = await subscriptionService.canUserTakeTest(userId);
        
        // Determine if unlimited tests
        const isUnlimited = plan.test_limit_daily === null;
        
        // Calculate remaining tests
        const testsUsedToday = subscription.tests_used_today || 0;
        const limitPerDay = plan.test_limit_daily || 3; // Default to 3 for free tier
        const remainingToday = isUnlimited ? Infinity : Math.max(0, limitPerDay - testsUsedToday);
        
        // Build response
        const limitStatus: LimitStatus = {
          canTake,
          isUnlimited,
          usedToday: testsUsedToday,
          limitPerDay: isUnlimited ? null : limitPerDay,
          remainingToday,
          reason: canTake ? null : (reason || null) // Ensure reason is never undefined
        };
        
        response = {
          limitStatus,
          subscription: {
            id: subscription.subscription_id,
            planName: plan.plan_name,
            planCode: plan.plan_code,
            status: subscription.status,
            lastTestDate: subscription.last_test_date ? new Date(subscription.last_test_date).toISOString() : null
          }
        };
      } catch (error) {
        console.error('Error checking test limits:', error);
        return NextResponse.json(
          { error: 'Failed to check test limits' },
          { status: 500 }
        );
      }
      
      // Cache for a short time (30 seconds)
      await cache.set(cacheKey, response, 30);
      source = 'database';
    }
    
    // Make sure response is defined as an object before spreading
    if (response && typeof response === 'object') {
      return NextResponse.json({ 
        ...response,
        source
      });
    } else {
      // Handle the case where response might not be an object
      return NextResponse.json({ 
        error: 'Invalid response format',
        source
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching test limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test limits' },
      { status: 500 }
    );
  }
}