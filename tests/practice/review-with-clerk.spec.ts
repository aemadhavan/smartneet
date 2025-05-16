// tests/practice/review-with-clerk.spec.ts
import { test, expect } from '@playwright/test';
import { PracticePage } from './PracticePage';
import { signInWithClerkSessionToken } from '../utils/clerkAuthUtils';

/**
 * Test suite for the review functionality using Clerk authentication
 */
test.describe('Practice Session Review with Clerk Auth', () => {
  // Before each test, sign in using Clerk test auth
  test.beforeEach(async ({ page }) => {
    await signInWithClerkSessionToken(page);
  });

  // Test the review page
  test('should display session summary with correct statistics', async ({ page }) => {
    // Create the PracticePage object
    const practicePage = new PracticePage(page);
    
    // Start a practice session
    await practicePage.gotoWithSubject('biology');
    
    // Complete the session
    await practicePage.completeEntireSession();
    
    // Verify we're on the summary page
    await expect(page.getByRole('heading', { name: /Session Summary/i })).toBeVisible();
    
    // Check for expected summary elements
    await expect(page.getByText(/Score/i)).toBeVisible();
    await expect(page.getByText(/Accuracy/i)).toBeVisible();
    await expect(page.getByText(/Total Questions/i)).toBeVisible();
    await expect(page.getByText(/Time Taken/i)).toBeVisible();
    
    // Verify navigation buttons are present
    await expect(page.getByRole('button', { name: /Start New Session/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Review Answers/i })).toBeVisible();
  });

  // Test navigation to detailed review page
  test('should navigate to detailed review page', async ({ page }) => {
    // Create the PracticePage object
    const practicePage = new PracticePage(page);
    
    // Start a practice session
    await practicePage.gotoWithSubject('biology');
    
    // Complete the session
    await practicePage.completeEntireSession();
    
    // Click on the Review Answers button
    await page.getByRole('link', { name: /Review Answers/i }).click();
    
    // Verify we're on the review page
    await expect(page.url()).toContain('/review');
  });

  // Additional tests can be added here...
});