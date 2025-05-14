// tests/utils/clerkAuthUtils.js

/**
 * Utilities for testing Clerk authentication in Playwright tests
 */

/**
 * Sign in using Clerk test session tokens without going through the OAuth flow
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function signInWithClerkSessionToken(page) {
  console.log('Starting Clerk test authentication');
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  console.log(`Using base URL: ${baseUrl}`);
  
  try {
    // Call your test auth API to get Clerk session tokens
    console.log(`Making auth request to ${baseUrl}/api/test/clerk-auth`);
    console.log(`Using email: ${process.env.TEST_USER_EMAIL || 'enmadhavan@gmail.com'}`);
    
    const response = await page.request.post(`${baseUrl}/api/test/clerk-auth`, {
      data: {
        provider: 'google',
        email: process.env.TEST_USER_EMAIL || 'enmadhavan@gmail.com'
      }
    });
    
    console.log(`Auth response status: ${response.status()}`);
    
    if (!response.ok()) {
      const body = await response.text();
      console.error(`Auth error body: ${body}`);
      throw new Error(`Failed to get Clerk session: ${response.status()} ${body}`);
    }
    
    const authData = await response.json();
    console.log('Auth data received:', JSON.stringify({
      success: authData.success,
      user: authData.user,
      session: authData.session,
      cookiesCount: authData.cookies?.length
    }, null, 2));
    
    // Set the Clerk session token cookies
    if (authData.cookies && authData.cookies.length > 0) {
      console.log(`Setting ${authData.cookies.length} cookies`);
      
      // Log each cookie (without values for security)
      authData.cookies.forEach((cookie, i) => {
        console.log(`Cookie ${i+1}: ${cookie.name}, domain: ${cookie.domain}, path: ${cookie.path}`);
      });
      
      await page.context().addCookies(authData.cookies);
      console.log('Successfully set Clerk session cookies');
    } else {
      throw new Error('No Clerk session cookies returned from auth API');
    }
    
    // Verify the session by navigating to a protected page
    console.log(`Navigating to ${baseUrl}/dashboard to verify session`);
    await page.goto(`${baseUrl}/dashboard`);
    
    // Check if we're properly authenticated (not redirected to sign-in)
    const currentUrl = page.url();
    console.log(`Current URL after navigation: ${currentUrl}`);
    
    if (currentUrl.includes('/sign-in')) {
      console.error('Authentication failed: Redirected to sign-in page');
      
      // Log cookies for debugging
      const cookies = await page.context().cookies();
      console.log(`Current cookies: ${cookies.length}`);
      cookies.forEach(c => console.log(`- ${c.name}: domain=${c.domain}, path=${c.path}`));
      
      // Get page content for debugging
      const content = await page.content();
      console.log(`Page content snippet: ${content.substring(0, 200)}...`);
      
      throw new Error('Authentication failed: Redirected to sign-in page');
    }
    
    // Wait for the page to load completely
    console.log('Waiting for page to load completely');
    await page.waitForLoadState('networkidle');
    console.log('Authentication successful');
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}