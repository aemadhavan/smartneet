// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Define types for Stripe objects
type StripeSubscription = {
  id: string;
  customer: string;
  metadata?: { userId?: string };
  items: { data: Array<{ price: { id: string } }> };
  status: string;
  current_period_start: number;
  current_period_end: number;
  trial_end: number | null;
};

type StripeInvoice = {
  id: string;
  subscription?: string;
  customer: string;
  metadata?: { userId?: string };
  amount_paid: number;
  payment_intent: string;
  payment_method_details?: { type: string };
  status: string;
  created: number;
  next_payment_attempt: number;
  hosted_invoice_url: string;
  customer_tax_ids?: Array<{ value: string }>;
  tax?: number;
  tax_percent?: number;
};

// Event handler functions
async function handleSubscriptionChange(subscription: StripeSubscription) {
  try {
    const stripeSubscriptionId = subscription.id;
    const stripeCustomerId = subscription.customer;
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }
    
    // Get the price ID to find the corresponding plan
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error('No price ID found in subscription');
      return;
    }

    if (!subscription || !subscription.items || !subscription.items.data) {
      console.error('Invalid subscription object received from Stripe');
      return;
    }
    
    // Find the plan by Stripe price ID
    const plans = await db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.price_id_stripe, priceId))
      .limit(1);
    
    if (plans.length === 0) {
      console.error(`No plan found for Stripe price ID: ${priceId}`);
      return;
    }
    
    const plan = plans[0];
    
    // Create or update subscription
    await subscriptionService.createOrUpdateSubscription({
      userId,
      planId: plan.plan_id,
      stripeSubscriptionId,
      stripeCustomerId,
      status: subscription.status as "active" | "canceled" | "past_due" | "unpaid" | "trialing" | "incomplete" | "incomplete_expired" | undefined,
      periodStart: new Date(subscription.current_period_start * 1000),
      periodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null
    });
  } catch (error) {
    console.error('Error handling subscription change:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: StripeSubscription) {
  try {
    // Update subscription status to canceled
    await subscriptionService.updateSubscriptionFromStripe(subscription.id);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: StripeInvoice) {
  try {
    if (!stripe) {
      console.error('Stripe is not configured');
      throw new Error('Stripe is not configured');
    }

    const stripeSubscriptionId = invoice.subscription;
    if (!stripeSubscriptionId) return;
    
    const userId = invoice.metadata?.userId;
    
    // Get user ID from subscription if not in invoice metadata
    let userIdFromSubscription: string | undefined;
    
    
    if (!userId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      userIdFromSubscription = subscription.metadata.userId;
      if (!userIdFromSubscription) {
        console.error('No userId found in subscription metadata');
        return;
      }
    }
    
    // Get subscription from our database
    const subscription = await subscriptionService.updateSubscriptionFromStripe(
      stripeSubscriptionId
    );
    
    if (!subscription) {
      console.error(`No subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
      return;
    }
    if (!invoice || typeof invoice.amount_paid !== 'number') {
      console.error('Invalid invoice object received from Stripe');
      return;
    }
    // Record payment
    await subscriptionService.recordPayment({
      userId: userId || userIdFromSubscription || subscription.user_id,
      subscriptionId: subscription.subscription_id,
      amountInr: Math.round(invoice.amount_paid / 100), // Convert paisa to rupees
      stripePaymentId: invoice.payment_intent,
      stripeInvoiceId: invoice.id,
      paymentMethod: invoice.payment_method_details?.type || 'card',
      paymentStatus: invoice.status,
      paymentDate: new Date(invoice.created * 1000),
      nextBillingDate: new Date(invoice.next_payment_attempt * 1000),
      receiptUrl: invoice.hosted_invoice_url,
      gstDetails: {
        gstNumber: invoice.customer_tax_ids?.[0]?.value ?? null,
        taxAmount: (invoice.tax || 0) / 100, // Convert from paise to rupees
        taxPercentage: invoice.tax_percent || 18, // Default to 18% GST
        hasGST: !!invoice.customer_tax_ids?.length,
        hsnSacCode: "998431", // HSN code for educational services
        placeOfSupply: "India" // Default place of supply
      }
      
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: StripeInvoice) {
  try {
    const stripeSubscriptionId = invoice.subscription;
    if (!stripeSubscriptionId) return;
    
    // Update subscription status
    await subscriptionService.updateSubscriptionFromStripe(stripeSubscriptionId);
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

// Stripe webhook handler
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (!stripe) {
      console.error('Stripe is not configured');
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      // Subscription created or updated
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as unknown as StripeSubscription);
        break;

      // Subscription deleted
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as unknown as StripeSubscription);
        break;

      // Payment succeeded
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as unknown as StripeInvoice);
        break;

      // Payment failed
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as unknown as StripeInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error handling webhook: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook handler failed: ${err.message}` },
      { status: 500 }
    );
  }
}
