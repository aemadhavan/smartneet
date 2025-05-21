// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans, user_subscriptions } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Define types for our local database records
interface DatabaseSubscription {
  subscription_id: number;
  user_id: string;
  current_period_end: Date;
}

// Type augmentation for Stripe's objects to fix missing properties
interface StripeSubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

interface StripeInvoiceWithPaymentDetails extends Stripe.Invoice {
  subscription?: string | { id: string };
  payment_intent?: string | { id: string };
  payment_method_details?: { type: string };
  tax?: number;
  tax_percent?: number;
}

// Event handler functions
async function handleSubscriptionChange(rawSubscription: Stripe.Subscription) {
  return db.transaction(async () => {
    try {
      // Cast to our augmented type
      const subscription = rawSubscription as StripeSubscriptionWithPeriods;
      
      const stripeSubscriptionId = subscription.id;
      const stripeCustomerId = getCustomerId(subscription.customer);
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
        // Ensure we have a valid status string
        status: subscription.status || 'active', // Provide a default value when undefined
        periodStart: new Date(subscription.current_period_start * 1000),
        periodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null
      });
    } catch (error) {
      console.error('Error handling subscription change:', error);
      throw error; // Re-throw to trigger transaction rollback
    }
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  return db.transaction(async () => {
    try {
      const stripeSubscriptionId = subscription.id;
      
      // Find the subscription directly in our database
      const userSubscriptions = await db
        .select()
        .from(user_subscriptions)
        .where(eq(user_subscriptions.stripe_subscription_id, stripeSubscriptionId))
        .limit(1);
      
      if (userSubscriptions.length === 0) {
        console.log(`No subscription found for Stripe ID: ${stripeSubscriptionId}, it may already be deleted`);
        return;
      }
      
      // Update the subscription status to canceled directly
      await db
        .update(user_subscriptions)
        .set({
          status: 'canceled',
          canceled_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(user_subscriptions.stripe_subscription_id, stripeSubscriptionId));
      
      console.log(`Successfully updated subscription ${stripeSubscriptionId} to canceled status`);
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
      throw error; // Re-throw to trigger transaction rollback
    }
  });
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

async function handlePaymentSucceeded(rawInvoice: Stripe.Invoice) {
  return db.transaction(async () => {
    try {
      // Cast to our augmented type
      const invoice = rawInvoice as StripeInvoiceWithPaymentDetails;
      
      console.log('Processing invoice payment success:', JSON.stringify(invoice, null, 2));
      
      if (!stripe) {
        console.error('Stripe is not configured');
        throw new Error('Stripe is not configured');
      }

      const stripeSubscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : (invoice.subscription?.id || '');
        
      if (!stripeSubscriptionId) {
        console.log('No subscription ID in invoice, skipping');
        return;
      }
      
      // Ensure metadata is treated as potentially null or undefined
      const userId = invoice.metadata?.userId ?? null; 
      
      // Get user ID from subscription if not in invoice metadata
      let userIdFromSubscription: string | null = null; 
      
      try {
        if (!userId) {
          const subscriptionObject = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          userIdFromSubscription = subscriptionObject.metadata?.userId ?? null;
          if (!userIdFromSubscription) {
            console.error('No userId found in subscription metadata');
            return;
          }
        }
      } catch (error) {
        console.error('Error retrieving subscription from Stripe:', error);
        throw error; // Re-throw to ensure transaction rollback
      }
      
      // Get subscription from our database
      let subscription: DatabaseSubscription | null = null;
      try {
        subscription = await subscriptionService.updateSubscriptionFromStripe(
          stripeSubscriptionId
        ) as DatabaseSubscription | null;
        
        if (!subscription) {
          console.error(`No subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
          throw new Error(`No subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
        }
      } catch (error) {
        console.error('Error updating subscription from Stripe:', error);
        throw error; // Re-throw to ensure transaction rollback
      }
      
      if (!invoice || typeof invoice.amount_paid !== 'number') {
        console.error('Invalid invoice object received from Stripe');
        throw new Error('Invalid invoice object received from Stripe');
      }
      
      // Ensure all required fields are non-undefined strings with explicit string typing
      // Handle payment_intent safely - it might be a string or an object with id
      // Force a default empty string if both are undefined (shouldn't happen with invoice.id fallback)
      const paymentIntentId: string = (typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : (invoice.payment_intent?.id || invoice.id || ''));

      // Handle nextBillingDate properly - make sure it's never undefined
      const nextBillingDate = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000)
        : new Date(subscription.current_period_end);

      // Get a safe payment method with explicit string typing
      const paymentMethod: string = (invoice.payment_method_details?.type || 'card');
      
      // Ensure invoice.id is used as string for stripeInvoiceId with explicit string typing
      const stripeInvoiceId: string = (invoice.id || '');
        
      // Record payment with careful null handling
      try {
        await subscriptionService.recordPayment({
          userId: userId || userIdFromSubscription || subscription.user_id,
          subscriptionId: subscription.subscription_id,
          amountInr: Math.round(invoice.amount_paid / 100), // Convert paisa to rupees
          stripePaymentId: paymentIntentId,
          stripeInvoiceId: stripeInvoiceId,
          paymentMethod: paymentMethod,
          paymentStatus: invoice.status || 'succeeded', // Default to succeeded if null
          paymentDate: new Date(invoice.created * 1000),
          nextBillingDate: nextBillingDate,
          receiptUrl: invoice.hosted_invoice_url || null,
          gstDetails: {
            gstNumber: invoice.customer_tax_ids?.[0]?.value || null,
            taxAmount: (invoice.tax || 0) / 100, // Convert from paise to rupees
            taxPercentage: invoice.tax_percent || 18, // Default to 18% GST
            hasGST: !!invoice.customer_tax_ids?.length,
            hsnSacCode: "998431", // HSN code for educational services
            placeOfSupply: "India" // Default place of supply
          }
        });
        console.log(`Payment recorded successfully for invoice: ${invoice.id}`);
      } catch (error) {
        console.error('Error recording payment:', error);
        throw error; // Re-throw to ensure transaction rollback
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error; 
    }
  });
}

async function handlePaymentFailed(rawInvoice: Stripe.Invoice) {
  try {
    // Cast to our augmented type
    const invoice = rawInvoice as StripeInvoiceWithPaymentDetails;
    
    const stripeSubscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : (invoice.subscription?.id || '');
      
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
  
  // In this version of Next.js, headers() returns a Promise
  // We need to await it before calling methods like get()
  const headerList = await headers();
  const signature = headerList.get('stripe-signature') || '';

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