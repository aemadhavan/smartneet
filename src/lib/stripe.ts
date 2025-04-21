// src/lib/stripe.ts
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Initialize Stripe server-side instance with better error handling
let stripe: Stripe | null = null;
let secretKey: string = '';
if (typeof window === 'undefined') {
  secretKey = process.env.STRIPE_SECRET_KEY || '';
  if (!secretKey) {
    console.error('Missing Stripe secret key in environment variables');
  }

  if (secretKey) {
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-03-31.basil', // Use the latest API version
      appInfo: {
        name: 'NEET Exam Prep Platform',
        version: '1.0.0',
      },
    });
  }
}
export { stripe };

// Initialize Stripe client-side with proper error handling
let stripePromise: Promise<StripeClient | null>;
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Missing Stripe publishable key in environment variables');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Helper to format price for Indian Rupees display
export const formatAmountForDisplay = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  });
  return formatter.format(amount);
};

// Convert amount to paisa for Stripe (Stripe requires amounts in smallest currency unit)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Create a Stripe checkout session
export async function createCheckoutSession({
  priceId,
  userId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured');
  }

  try {
    // Look for existing customers with this email
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customerId: string;

    if (existingCustomers.data.length > 0) {
      // Use existing customer
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      tax_id_collection: {
        enabled: true, // For GST collection
      },
      allow_promotion_codes: true, // Enable promo codes
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Retrieve customer portal session for managing subscriptions
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured');
  }
  
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: portalSession.url };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

// Get subscription data from Stripe
export async function getSubscriptionFromStripe(subscriptionId: string): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured');
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'default_payment_method', 'items.data.price.product'],
    });
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

// Cancel subscription in Stripe
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured');
  }
  
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Reactivate subscription in Stripe
export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  if (!secretKey) {
    throw new Error('Stripe secret key is not configured');
  }
  
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}
