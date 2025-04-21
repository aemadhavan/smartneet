// src/app/api/customer-portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createCustomerPortalSession } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { user_subscriptions } from '@/db/schema';

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

    // Get customer ID from request or fetch from db
    const body = await req.json();
    let { customerId } = body;

    if (!customerId) {
      // Try to get the customer ID from the user's subscription
      const subscriptions = await db
        .select()
        .from(user_subscriptions)
        .where(eq(user_subscriptions.user_id, userId))
        .limit(1);

      if (subscriptions.length === 0 || !subscriptions[0].stripe_customer_id) {
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 404 }
        );
      }

      customerId = subscriptions[0].stripe_customer_id;
    }

    // Create a customer portal session
    const { url } = await createCustomerPortalSession({
      customerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}