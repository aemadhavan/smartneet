// tests/utils/authUtils.js - Alternative approach using API
import { expect } from '@playwright/test';

/**
 * Signs in a user via API.
 * @param page - The Playwright page object.
 */
export async function signInViaApi(page) {
  // Make API call to get authenticated session token
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/test/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      testUserType: 'free', // or 'premium'
      testAuthKey: process.env.TEST_AUTH_SECRET // A secret key only for tests
    }),
  });
  
  const { token } = await response.json();
  
  // Set the authentication cookie or session
  await page.evaluate((authToken) => {
    document.cookie = `__session=${authToken}; path=/`;
  }, token);
  
  // Navigate to a page in the authenticated area
  await page.goto('/dashboard');
  
  // Verify we're logged in
  await expect(page.getByText(/dashboard|account/i)).toBeVisible();
}
