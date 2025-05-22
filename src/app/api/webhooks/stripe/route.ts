// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans, user_subscriptions } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { CacheInvalidator } from '@/lib/cacheInvalidation';

// Helper function to safely access Stripe object properties
function getStripeProperty<T>(obj: unknown, property: string): T | undefined {
  if (obj && typeof obj === 'object' && property in obj) {
    return (obj as Record<string, unknown>)[property] as T;
  }
  return undefined;
}

// Event handler functions
async function handleSubscriptionChange(subscriptionData: Stripe.Subscription) {
  const userId = subscriptionData.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata for handleSubscriptionChange');
    return; // Cannot proceed without userId for cache invalidation
  }

  await db.transaction(async (tx) => {
    try {
      const stripeSubscriptionId = subscriptionData.id;
      const stripeCustomerId = getCustomerId(subscriptionData.customer);
      
      // Get the price ID to find the corresponding plan
      const priceId = subscriptionData.items.data[0]?.price.id;
      if (!priceId) {
        console.error('No price ID found in subscription');
        throw new Error('No price ID found in subscription');
      }

      if (!subscriptionData.items?.data) {
        console.error('Invalid subscription object received from Stripe (no items data)');
        throw new Error('Invalid subscription object received from Stripe (no items data)');
      }
      
      // Find the plan by Stripe price ID using the transaction object
      const plans = await tx
        .select()
        .from(subscription_plans)
        .where(eq(subscription_plans.price_id_stripe, priceId))
        .limit(1);
      
      if (plans.length === 0) {
        console.error(`No plan found for Stripe price ID: ${priceId}`);
        throw new Error(`No plan found for Stripe price ID: ${priceId}`);
      }
      
      const plan = plans[0];
      
      // Safely access subscription properties
      const subscriptionObj = subscriptionData as unknown as Record<string, unknown>;
      const currentPeriodStart = (subscriptionObj.current_period_start as number) || Math.floor(Date.now() / 1000);
      const currentPeriodEnd = (subscriptionObj.current_period_end as number) || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      
      // Create or update subscription using the transaction object
      await subscriptionService.createOrUpdateSubscription({
        userId,
        planId: plan.plan_id,
        stripeSubscriptionId,
        stripeCustomerId,
        status: subscriptionData.status || 'active',
        periodStart: new Date(currentPeriodStart * 1000),
        periodEnd: new Date(currentPeriodEnd * 1000),
        trialEnd: subscriptionData.trial_end
          ? new Date(subscriptionData.trial_end * 1000)
          : null
      }, tx); // Pass tx
    } catch (error) {
      console.error('Error handling subscription change:', error);
      throw error; // Re-throw to trigger transaction rollback
    }
  });

  // Cache invalidation after successful transaction
  await CacheInvalidator.invalidateUserSubscription(userId);
}

async function handleSubscriptionDeleted(subscriptionData: Stripe.Subscription) {
  // Attempt to get userId from metadata first
  let userId = subscriptionData.metadata?.userId;

  // If userId is not in metadata, we need to fetch it before deleting.
  // This part is tricky because the data is about to be "deleted" or marked as such.
  // For cache invalidation, we MUST have the userId.
  // If the subscription object from Stripe doesn't have userId in metadata,
  // we might need to look it up from our DB using stripeSubscriptionId BEFORE the transaction.
  
  if (!userId) {
    const subBeforeDelete = await db.select({ userId: user_subscriptions.user_id })
      .from(user_subscriptions)
      .where(eq(user_subscriptions.stripe_subscription_id, subscriptionData.id))
      .limit(1);
    if (subBeforeDelete.length > 0 && subBeforeDelete[0].userId) {
      userId = subBeforeDelete[0].userId;
    } else {
      // If still no userId, we might not be able to invalidate cache correctly.
      // This could happen if the webhook arrives after our record is already gone or never had userId.
      console.warn(`Cannot determine userId for cache invalidation on subscription deletion: ${subscriptionData.id}`);
      // Proceed with deletion but cache invalidation might be missed.
    }
  }
  
  await db.transaction(async (tx) => {
    try {
      const stripeSubscriptionId = subscriptionData.id;
      
      // Find the subscription directly in our database using the transaction
      const existingSubscriptions = await tx
        .select()
        .from(user_subscriptions)
        .where(eq(user_subscriptions.stripe_subscription_id, stripeSubscriptionId))
        .limit(1);
      
      if (existingSubscriptions.length === 0) {
        console.log(`No subscription found for Stripe ID: ${stripeSubscriptionId}, it may already be deleted or never existed.`);
        return; // Nothing to do if not found
      }
      
      // Update the subscription status to canceled directly using the transaction
      await tx
        .update(user_subscriptions)
        .set({
          status: 'canceled',
          canceled_at: new Date(), // Use current time for cancellation
          updated_at: new Date()
        })
        .where(eq(user_subscriptions.stripe_subscription_id, stripeSubscriptionId));
      
      console.log(`Successfully updated subscription ${stripeSubscriptionId} to canceled status`);
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
      throw error; // Re-throw to trigger transaction rollback
    }
  });

  if (userId) {
    await CacheInvalidator.invalidateUserSubscription(userId);
  }
}

// Helper function to extract customer ID
function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string {
  if (typeof customer === 'string') {
    return customer;
  }
  if (customer && 'id' in customer) {
    return customer.id;
  }
  throw new Error('Invalid customer ID type');
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  return db.transaction(async (tx) => {
    // Pass `tx` to db operations and service methods
    try {
      console.log('Processing invoice payment success:', JSON.stringify(invoice, null, 2));
      
      if (!stripe) {
        console.error('Stripe is not configured');
        throw new Error('Stripe is not configured');
      }

      // Safely access invoice properties
      const invoiceObj = invoice as unknown as Record<string, unknown>;
      const stripeSubscriptionId = getStripeProperty<string>(invoiceObj, 'subscription');
      
      if (!stripeSubscriptionId) {
        console.log('No subscription ID in invoice, skipping');
        return; // Or throw new Error('Missing subscription ID in invoice') if critical
      }
      
      let finalUserId: string | null = invoice.metadata?.userId || null; 
      
      if (!finalUserId) {
        const subscriptionObject = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        // Fix the TypeScript error by explicitly handling the undefined case
        const metadataUserId = subscriptionObject.metadata?.userId;
        finalUserId = metadataUserId ? metadataUserId : null;
        
        if (!finalUserId) {
          console.error('No userId found in invoice or subscription metadata');
          throw new Error('User ID not found for payment success handling');
        }
      }
      
      // Get subscription from our database using the transaction
      // Pass the userId if available to scope the search
      const subscription = await subscriptionService.updateSubscriptionFromStripe(
        stripeSubscriptionId, 
        finalUserId ? finalUserId : undefined, 
        tx
      );
        
      if (!subscription) {
        console.error(`No subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
        throw new Error(`No subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
      }
      
      if (!invoice || typeof invoice.amount_paid !== 'number') {
        console.error('Invalid invoice object received from Stripe');
        throw new Error('Invalid invoice object received from Stripe');
      }
      
      // Safely access payment_intent
      const paymentIntentProperty = getStripeProperty<string | { id?: string }>(invoiceObj, 'payment_intent');
      let paymentIntentId: string | null = null;
      
      if (typeof paymentIntentProperty === 'string') {
        paymentIntentId = paymentIntentProperty;
      } else if (paymentIntentProperty && typeof paymentIntentProperty === 'object') {
        paymentIntentId = paymentIntentProperty.id || null;
      }

      if (!paymentIntentId) {
        console.log('No payment intent ID found in invoice, using invoice ID instead');
        paymentIntentId = invoice.id || 'fallback-invoice-id';
      }

      const nextBillingDate = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000)
        : new Date(subscription.current_period_end);

      // Safely access payment method details and tax information
      const paymentMethodDetails = getStripeProperty<{ type?: string }>(invoiceObj, 'payment_method_details');
      const taxAmount = getStripeProperty<number>(invoiceObj, 'tax') || 0;
      const taxPercent = getStripeProperty<number>(invoiceObj, 'tax_percent') || 18;

      // Record payment using the transaction
      await subscriptionService.recordPayment({
        userId: finalUserId || subscription.user_id,
        subscriptionId: subscription.subscription_id,
        amountInr: Math.round(invoice.amount_paid / 100),
        stripePaymentId: paymentIntentId || invoice.id || 'fallback-payment-id', // Ensure it's never null or undefined
        stripeInvoiceId: invoice.id || 'unknown',
        paymentMethod: paymentMethodDetails?.type || 'card',
        paymentStatus: invoice.status || 'succeeded', 
        paymentDate: new Date(invoice.created * 1000),
        nextBillingDate: nextBillingDate, 
        receiptUrl: invoice.hosted_invoice_url || null,
        gstDetails: {
          gstNumber: invoice.customer_tax_ids?.[0]?.value || null,
          taxAmount: taxAmount / 100, 
          taxPercentage: taxPercent, 
          hasGST: !!invoice.customer_tax_ids?.length,
          hsnSacCode: "998431", 
          placeOfSupply: "India" 
        }
      }, tx); // Pass tx
      console.log(`Payment recorded successfully for invoice: ${invoice.id}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error; 
    }
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Try to get userId for cache invalidation. This might be optional if failure doesn't change our sub status.
  let userIdForCache: string | null = invoice.metadata?.userId || null;
  
  if (!userIdForCache) {
    const invoiceObj = invoice as unknown as Record<string, unknown>;
    const stripeSubscriptionId = getStripeProperty<string>(invoiceObj, 'subscription');
    
    if (stripeSubscriptionId && stripe) {
      try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const metadataUserId = subscription.metadata?.userId;
        userIdForCache = metadataUserId ? metadataUserId : null;
      } catch (e) {
        console.error("Error retrieving subscription to get userId for payment_failed cache invalidation", e);
      }
    }
  }

  try {
    const invoiceObj = invoice as unknown as Record<string, unknown>;
    const stripeSubscriptionId = getStripeProperty<string>(invoiceObj, 'subscription');
    
    if (!stripeSubscriptionId) return;
    
    // This call might not need to be part of a transaction if it's just updating status
    // and doesn't have other dependent DB operations in this specific handler.
    // However, if updateSubscriptionFromStripe itself becomes transactional internally, this is fine.
    // For now, assuming it can be called outside a transaction or handles its own.
    // If it were to be part of a transaction here, we'd need to start one: db.transaction(async (tx) => { ... })
    await subscriptionService.updateSubscriptionFromStripe(stripeSubscriptionId, userIdForCache || undefined); // Pass userId if available
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

// Stripe webhook handler
export async function POST(req: NextRequest) {
  const body = await req.text();
  // Fix: In newer versions of Next.js, headers() returns a Promise
  const headerList = await headers();
  const signature = headerList.get('stripe-signature') as string;

  if (!signature) {
    console.error('No stripe signature in request headers');
    return NextResponse.json({ error: 'No Stripe signature found' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    if (!stripe) {
      console.error('Stripe is not configured');
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
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
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      // Subscription deleted
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // Payment succeeded
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      // Payment failed
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const err = error as Error;
    // Log the detailed error for server-side inspection
    console.error(`Error handling webhook event type ${event?.type}:`, err.message, err.stack);
    // Return a generic error message to the client (Stripe)
    return NextResponse.json(
      { error: 'An unexpected error occurred while handling the webhook event.' },
      { status: 500 }
    );
  }
}