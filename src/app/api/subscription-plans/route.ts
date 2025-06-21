// src/app/api/subscription-plans/route.ts (Updated)
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans } from '@/db/schema';

export async function GET() {
  try {
    console.log('Fetching subscription plans from database...');
    
    // Fetch directly from database without cache for debugging
    const plans = await db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.is_active, true))
      .orderBy(subscription_plans.price_inr);
    
    console.log(`Found ${plans.length} active subscription plans`);
    
    // Process the features field to ensure it's a proper array
    const processedPlans = plans.map(plan => {
      // If features is a string (JSON string), parse it into an array
      if (typeof plan.features === 'string') {
        try {
          const parsedFeatures = JSON.parse(plan.features);
          return {
            ...plan,
            features: parsedFeatures
          };
        } catch (e) {
          console.log(`Failed to parse features for plan ${plan.plan_id}:`, e);
          // If it's not valid JSON, split by comma
          return {
            ...plan,
            features: plan.features.split(',').map(f => f.trim())
          };
        }
      }
      return plan;
    });
    
    console.log('Processed plans:', processedPlans.map(p => ({ id: p.plan_id, name: p.plan_name })));
    
    return NextResponse.json({ plans: processedPlans, source: 'database' });
  } catch (error: unknown) {
    // Log the detailed error for server-side inspection
    console.error('Error fetching subscription plans:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return a more detailed error message for debugging
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription plans',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}