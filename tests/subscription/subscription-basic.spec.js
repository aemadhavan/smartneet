// tests/subscription/subscription-basic.spec.js
import { test, expect } from '@playwright/test';
import { setupStripeTestEnvironment } from '../utils/stripeTestSetup';
import { signInViaApi } from '../utils/authUtils';

// Run setup once before all tests
test.beforeAll(async () => {
  if (!process.env.CI) {
    await setupStripeTestEnvironment();
  }
});

test('free user should see upgrade option', async ({ page }) => {
  // Sign in as a free user
await signInViaApi(page);
  
  // Navigate to pricing/subscription page
  await page.goto('/pricing');
  
  // Verify current plan is shown as Free
  await expect(page.getByText('Current Plan: Free', { exact: false })).toBeVisible();
  
  // Verify upgrade button is visible
  await expect(page.getByRole('button', { name: /upgrade|subscribe/i })).toBeVisible();
});

test('free user should have limited test access', async ({ page }) => {
  // Sign in as a free user
  await signInViaApi(page);
  
  // Navigate to practice page
  await page.goto('/practice');
  
  // Check for test limit indicator
  await expect(page.getByText(/tests remaining|test limit/i)).toBeVisible();
});
