// src/app/api/user/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { user_subscriptions, subscription_plans } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { cache } from '@/lib/cache';

export async function GET(req: NextRequest) {
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
      
      // Combine subscription with plan details
      subscriptionData = {
        ...subscription,
        plan
      };
      
      // Cache for 5 minutes (300 seconds)
      await cache.set(cacheKey, subscriptionData, 300);
      source = 'database';
    }
    
    return NextResponse.json({ 
      subscription: subscriptionData,
      source
    });
  } catch (error: any) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}