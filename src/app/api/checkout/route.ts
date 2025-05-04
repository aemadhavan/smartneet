// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckoutSession } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get plan details
    const plans = await db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.plan_id, planId))
      .limit(1);

    if (plans.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const plan = plans[0];

    if (!plan.is_active) {
      return NextResponse.json(
        { error: 'Plan is not available' },
        { status: 400 }
      );
    }

    // Get current user for email
    const user = await currentUser();
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }
    if (plan.plan_code === 'free') {
      // Handle free plan subscription without Stripe
      // Direct creation in your database
      await subscriptionService.createOrUpdateSubscription({
        userId,
        planId: plan.plan_id,
        stripeSubscriptionId: 'free_plan',
        stripeCustomerId: 'free_customer',
        status: 'active',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });
      
      return NextResponse.json({ 
        success: true, 
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true` 
      });
    }
    // Create a Stripe checkout session
    const { sessionId } = await createCheckoutSession({
      priceId: plan.price_id_stripe,
      userId,
      customerEmail: user.emailAddresses[0].emailAddress,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({  
      success: true,
      isPaid: true,
      sessionId  });
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}