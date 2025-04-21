// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { headers } from 'next/headers';

// Event handler functions
async function handleSubscriptionChange(subscription: any) {
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
      status: subscription.status,
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

async function handleSubscriptionDeleted(subscription: any) {
  try {
    // Update subscription status to canceled
    await subscriptionService.updateSubscriptionFromStripe(subscription.id);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const stripeSubscriptionId = invoice.subscription;
    if (!stripeSubscriptionId) return;
    
    const stripeCustomerId = invoice.customer;
    const userId = invoice.metadata?.userId;
    
    // Get user ID from subscription if not in invoice metadata
    if (!userId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      if (!subscription.metadata.userId) {
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
    
    // Record payment
    await subscriptionService.recordPayment({
      userId: userId || subscription.user_id,
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
        gstNumber: invoice.customer_tax_ids?.[0]?.value,
        taxAmount: invoice.tax || 0,
        taxPercentage: invoice.tax_percent || 0,
        hasGST: !!invoice.customer_tax_ids?.length
      }
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: any) {
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

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      // Subscription created or updated
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;

      // Subscription deleted
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      // Payment succeeded
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      // Payment failed
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
}
