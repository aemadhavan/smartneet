// src/app/api/user/test-limits/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans } from '@/db/schema';
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

// Default free subscription data to use in case of errors
const DEFAULT_FREE_SUBSCRIPTION: TestLimitResponse = {
  limitStatus: {
    canTake: true,
    isUnlimited: false,
    usedToday: 0,
    limitPerDay: 3,
    remainingToday: 3,
    reason: null
  },
  subscription: {
    id: 0,
    planName: 'Free Plan',
    planCode: 'free',
    status: 'active',
    lastTestDate: null
  }
};

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      // Return default free access for unauthenticated users
      return NextResponse.json({
        ...DEFAULT_FREE_SUBSCRIPTION,
        source: 'default-unauthenticated'
      });
    }
    
    // Get URL to check for cache-busting parameter
    const url = new URL(request.url);
    const skipCache = url.searchParams.has('t');

    // Define cache key for test limit status
    const cacheKey = `user:${userId}:test-limits`;
    
    // Try to get from cache first (longer TTL as it changes less frequently)
    // Only if skipCache is false
    let response = skipCache ? null : await cache.get<TestLimitResponse>(cacheKey);
    let source = skipCache ? 'forced-refresh' : 'cache';
    
    if (!response) {
      try {
        // Set a timeout for database operations (5 seconds)
        let timeoutId: NodeJS.Timeout | null = null;
        const dbTimeoutPromise = new Promise<TestLimitResponse>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Database operation timeout'));
          }, 5000);
        });
        
        // Database query promise
        const dbQueryPromise = async (): Promise<TestLimitResponse> => {
          // Get user subscription with timeout protection
          const subscription = await subscriptionService.getUserSubscription(userId);
          
          // Always reset daily counter if needed
          await subscriptionService.resetDailyCounterIfNeeded(userId, subscription);
          // Fetch updated subscription after potential reset
          const updatedSubscription = await subscriptionService.getUserSubscription(userId);
          
          if (!updatedSubscription) {
            console.log(`No subscription found for user ${userId}, using free plan`);
            return DEFAULT_FREE_SUBSCRIPTION;
          }
          
          // Get subscription plan
          const plans = await db
            .select()
            .from(subscription_plans)
            .where(eq(subscription_plans.plan_id, updatedSubscription.plan_id))
            .limit(1);
          
          const plan = plans.length > 0 ? plans[0] : null;
          
          if (!plan) {
            console.log(`No plan found for subscription ${updatedSubscription.subscription_id}, using free plan`);
            return DEFAULT_FREE_SUBSCRIPTION;
          }
          
          // Check if user can take a test
          const { canTake, reason } = await subscriptionService.canUserTakeTest(userId);
          
          // Determine if unlimited tests
          const isUnlimited = plan.test_limit_daily === null;
          
          // Calculate remaining tests
          const testsUsedToday = updatedSubscription.tests_used_today || 0;
          const limitPerDay = plan.test_limit_daily || 3; // Default to 3 for free tier
          const remainingToday = isUnlimited ? Number.MAX_SAFE_INTEGER : Math.max(0, limitPerDay - testsUsedToday);
          
          console.log(`[DEBUG] Test limits calculation for user ${userId}:`, {
            testsUsedToday,
            limitPerDay,
            remainingToday,
            isUnlimited,
            canTake,
            lastTestDate: updatedSubscription.last_test_date ? 
              (updatedSubscription.last_test_date instanceof Date ? 
                updatedSubscription.last_test_date.toISOString() : 
                String(updatedSubscription.last_test_date)) : null,
            lastTestDateType: typeof updatedSubscription.last_test_date,
            planName: plan.plan_name,
            source: 'database'
          });
          
          // Build response
          return {
            limitStatus: {
              canTake,
              isUnlimited,
              usedToday: testsUsedToday,
              limitPerDay: isUnlimited ? null : limitPerDay,
              remainingToday,
              reason: canTake ? null : (reason || null) // Ensure reason is never undefined
            },
            subscription: {
              id: updatedSubscription.subscription_id,
              planName: plan.plan_name,
              planCode: plan.plan_code,
              status: updatedSubscription.status,
              lastTestDate: updatedSubscription.last_test_date ? new Date(updatedSubscription.last_test_date).toISOString() : null
            }
          };
        };
        
        // Race between database query and timeout
        response = await Promise.race([dbQueryPromise(), dbTimeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
        
        // Cache for a longer time (2 minutes) since this doesn't change that often
        await cache.set(cacheKey, response, 120);
        source = 'database';
      } catch (error) {
        console.error('Database or timeout error:', error);
        // Use default free plan on error
        response = DEFAULT_FREE_SUBSCRIPTION;
        source = 'error-default';
        
        // Only cache error response for 15 seconds to allow quick retry
        await cache.set(cacheKey, response, 15);
        
        // Add delay before returning to prevent rapid retries
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Make sure response is defined as an object before spreading
    if (response && typeof response === 'object') {
      return NextResponse.json({ 
        ...response,
        source
      });
    } else {
      // Handle the case where response might not be an object
      console.error('Invalid response format', response);
      return NextResponse.json({ 
        ...DEFAULT_FREE_SUBSCRIPTION,
        source: 'invalid-format-default'
      });
    }
  } catch (error) {
    console.error('Unhandled error in test limits API:', error);
    
    // Add delay before returning to prevent rapid retries
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      ...DEFAULT_FREE_SUBSCRIPTION,
      source: 'unhandled-error-default'
    });
  }
}