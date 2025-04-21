// src/app/api/subscription-plans/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans } from '@/db/schema';
import { cache } from '@/lib/cache';

export async function GET() {
  try {
    // Define cache key
    const cacheKey = 'api:subscription-plans:all';
    
    // Try to get from cache first
    let plans = await cache.get<typeof subscription_plans.$inferSelect[]>(cacheKey);
    let source = 'cache';
    
    // If not in cache, fetch from database
    if (!plans) {
      plans = await db
        .select()
        .from(subscription_plans)
        .where(eq(subscription_plans.is_active, true))
        .orderBy(subscription_plans.price_inr);
      
      // Cache for 1 hour (3600 seconds)
      await cache.set<typeof subscription_plans.$inferSelect[]>(cacheKey, plans, 3600);
      source = 'database';
    }
    
    return NextResponse.json({ plans, source });
  } catch (error: unknown) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
