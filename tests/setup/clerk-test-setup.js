// tests/setup/clerk-test-setup.js

/**
 * Global setup for Clerk testing
 *
 * This file configures test environment variables and settings
 * required for Clerk authentication in tests.
 */

// Ensure the required environment variables for Clerk testing are set
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y29udGVudC1yb29zdGVyLTU3LmNsZXJrLmFjY291bnRzLmRldiQ';
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_WolPXm0HNnk8IZbDAxFCvRT811QDHpJ7uX7KCVthIe';

// For testing, you should use specific test API keys from Clerk
// Never use production keys in tests

// Set up test user - should be a real user in your Clerk test instance
process.env.TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'enmadhavan@gmail.com';

// Optional: Configure other Clerk-specific test settings
process.env.CLERK_API_URL = process.env.CLERK_API_URL || 'https://api.clerk.dev';
process.env.NEXT_PUBLIC_CLERK_FRONTEND_API = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || 'https://dev.smarterneet.com';

console.log('Clerk test environment configured');