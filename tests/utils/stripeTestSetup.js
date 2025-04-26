// tests/utils/stripeTestSetup.js
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

/**
 * Sets up the Stripe test environment with required products, prices,
 * and webhook endpoints for end-to-end testing
 */
export async function setupStripeTestEnvironment() {
  console.log('Setting up Stripe test environment...');
  
  const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);
  
  try {
    // Create test products and prices if they don't exist
    const productMap = await createTestProductsAndPrices(stripe);
    
    console.log('Stripe test environment setup complete.');
    return productMap;
  } catch (error) {
    console.error('Error setting up Stripe test environment:', error);
    throw error;
  }
}

/**
 * Creates test products and prices in Stripe
 */
async function createTestProductsAndPrices(stripe) {
  const productMap = new Map();
  
  // Define test products
  const productConfigs = [
    {
      name: 'Free Plan',
      description: '3 tests per day',
      metadata: { plan_code: 'free' },
      default_price_data: null // Free plan has no price
    },
    {
      name: 'Premium Plan',
      description: 'Unlimited tests',
      metadata: { plan_code: 'premium' },
      default_price_data: {
        unit_amount: 299900, // INR 2,999.00 (in paise)
        currency: 'inr',
        recurring: { interval: 'month' },
        tax_behavior: 'inclusive'
      }
    }
  ];
  
  // Check existing products to avoid duplicates
  const existingProducts = await stripe.products.list({ limit: 100, active: true });
  const existingProductMap = new Map(
    existingProducts.data.map(product => [product.metadata.plan_code, product])
  );
  
  // Create or update products
  for (const config of productConfigs) {
    const existingProduct = existingProductMap.get(config.metadata.plan_code);
    
    if (existingProduct) {
      console.log(`Product exists for ${config.name}, using existing: ${existingProduct.id}`);
      productMap.set(config.metadata.plan_code, {
        product: existingProduct,
        price: existingProduct.default_price
      });
    } else {
      console.log(`Creating new product for ${config.name}`);
      const product = await stripe.products.create(config);
      
      // For paid plans, retrieve the created price
      let price = null;
      if (config.default_price_data) {
        const prices = await stripe.prices.list({ product: product.id });
        price = prices.data[0];
      }
      
      productMap.set(config.metadata.plan_code, { product, price });
    }
  }
  
  return productMap;
}

/**
 * Helper to create test users with specific test states
 */
export async function createTestUsers() {
  // This would create test users via your API
  console.log('Creating test users...');
  // Implementation depends on your user creation API
}