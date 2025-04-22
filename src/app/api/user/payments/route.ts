// src/app/api/user/payments/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { cache } from '@/lib/cache';

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
    const cacheKey = `api:user:${userId}:payments`;
    
    // Try to get from cache first
    let payments = await cache.get(cacheKey);
    let source = 'cache';
    
    // If not in cache, fetch payments from database
    if (!payments) {
      payments = await subscriptionService.getUserPaymentHistory(userId);
      
      // Cache for 5 minutes (300 seconds)
      await cache.set(cacheKey, payments, 300);
      source = 'database';
    }
    
    return NextResponse.json({ payments, source });
  } catch (error: unknown) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}