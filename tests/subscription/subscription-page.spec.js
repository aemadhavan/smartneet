// tests/subscription/subscription-page.spec.js
import { test, expect } from '@playwright/test';
import { setupStripeTestEnvironment } from '../utils/stripeTestSetup';

// Run setup once before all tests
test.beforeAll(async () => {
  // Only run setup in local environment to avoid side effects in CI
  if (!process.env.CI) {
    await setupStripeTestEnvironment();
  }
});

test('subscription page should load correctly', async ({ page }) => {
  // Navigate to the pricing page
  await page.goto('/pricing');
  
  // Verify page loaded correctly
  await expect(page).toHaveTitle(/Pricing|Plans|Subscription/);
  
  // Verify subscription plans are displayed
  await expect(page.getByText('Free Plan', { exact: false })).toBeVisible();
  await expect(page.getByText('Premium Plan', { exact: false })).toBeVisible();
  
  // Verify pricing information is displayed
  await expect(page.getByText('₹2,999', { exact: false })).toBeVisible();
});