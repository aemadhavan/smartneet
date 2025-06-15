import Stripe from 'stripe';

// Stripe configuration and version management
export const STRIPE_CONFIG = {
  // API version - update this when Stripe releases a new version
  API_VERSION: '2025-05-28.basil' as const,
  
  // App information
  APP_INFO: {
    name: 'SmartNeet',
    version: '1.0.0',
  },
  
  // Feature flags for Stripe features
  FEATURES: {
    ENABLE_PROMO_CODES: true,
    ENABLE_TAX_COLLECTION: true,
    ENABLE_ADDRESS_COLLECTION: true,
  },
  
  // Payment settings
  PAYMENT_SETTINGS: {
    CURRENCY: 'inr',
    PAYMENT_METHODS: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
  },
} as const;

// Type for the configuration
export type StripeConfig = typeof STRIPE_CONFIG;

// Helper to check if we need to update the API version
export function checkStripeVersion(currentVersion: string): boolean {
  // You can implement version comparison logic here
  // For now, we'll just return true if versions don't match
  return currentVersion !== STRIPE_CONFIG.API_VERSION;
}

// Helper to get payment methods in the format Stripe expects
export function getPaymentMethods(): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  return [...STRIPE_CONFIG.PAYMENT_SETTINGS.PAYMENT_METHODS];
} 