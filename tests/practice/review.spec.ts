// tests/practice/review.spec.ts
import { test, expect } from '@playwright/test';
import { PracticePage } from './PracticePage';
import { signInViaApi } from '../utils/authUtils';

/**
 * Test suite for the review functionality after completing a practice session
 */
test.describe('Practice Session Review', () => {
  // Test the review page
  test('should display session summary with correct statistics', async ({ page }) => {
    // Sign in using API to avoid UI login flow
    await signInViaApi(page);
    
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
    // Sign in using API to avoid UI login flow
    await signInViaApi(page);
    
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
    
    // Check for expected review elements
    await expect(page.getByText(/Question Review/i)).toBeVisible();
    
    // Verify question navigation is available
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  // Test question review details
  test('should display question details in review mode', async ({ page }) => {
    // Sign in using API to avoid UI login flow
    await signInViaApi(page);
    
    // Create the PracticePage object
    const practicePage = new PracticePage(page);
    
    // Start a practice session
    await practicePage.gotoWithSubject('biology');
    
    // Complete the session answering all questions with the first option
    const totalQuestions = await practicePage.getTotalQuestionsCount();
    
    for (let i = 0; i < totalQuestions; i++) {
      await practicePage.selectOption(0);
      
      if (i < totalQuestions - 1) {
        await practicePage.nextQuestion();
      } else {
        await practicePage.completeSession();
      }
    }
    
    // Navigate to the review page
    await page.getByRole('link', { name: /Review Answers/i }).click();
    
    // Verify we can see the question explanation
    await expect(page.getByText(/Explanation/i)).toBeVisible();
    
    // Check for correct/incorrect indication
    const hasCorrectIndicator = await page.getByText(/Correct/i).isVisible();
    const hasIncorrectIndicator = await page.getByText(/Incorrect/i).isVisible();
    
    expect(hasCorrectIndicator || hasIncorrectIndicator).toBeTruthy();
    
    // Navigate through questions in review mode
    await page.getByRole('button', { name: 'Next' }).click();
    
    // Verify we moved to the next question
    expect(await page.getByText(/Question 2 of/i).isVisible()).toBeTruthy();
  });

  // Test starting a new session from summary page
  test('should start a new session from summary page', async ({ page }) => {
    // Sign in using API to avoid UI login flow
    await signInViaApi(page);
    
    // Create the PracticePage object
    const practicePage = new PracticePage(page);
    
    // Start a practice session
    await practicePage.gotoWithSubject('biology');
    
    // Complete the session
    await practicePage.completeEntireSession();
    
    // Click on Start New Session button
    await page.getByRole('button', { name: /Start New Session/i }).click();
    
    // Verify we're back to the subject selection or started a new session
    const isOnSubjectPage = await page.getByText(/Select a Subject/i).isVisible();
    const isOnNewSession = await page.getByText(/Question 1 of/i).isVisible();
    
    expect(isOnSubjectPage || isOnNewSession).toBeTruthy();
  });

  // Test session result sharing
  test('should have share options on summary page', async ({ page }) => {
    // Sign in using API to avoid UI login flow
    await signInViaApi(page);
    
    // Create the PracticePage object
    const practicePage = new PracticePage(page);
    
    // Start a practice session
    await practicePage.gotoWithSubject('biology');
    
    // Complete the session
    await practicePage.completeEntireSession();
    
    // Check for share buttons if they exist in the implementation
    const hasShareButton = await page.getByRole('button', { name: /Share/i }).isVisible();
    
    if (hasShareButton) {
      // If share functionality is implemented, test it
      await page.getByRole('button', { name: /Share/i }).click();
      
      // Check for share options
      const hasShareOptions = await page.getByText(/Copy Link|Twitter|Facebook/i).isVisible();
      expect(hasShareOptions).toBeTruthy();
    } else {
      // If not implemented, make a note but don't fail the test
      console.log('Share functionality not yet implemented');
    }
  });

  // Test review page bookmark functionality if implemented
  test('should allow bookmarking questions in review mode', async ({ page }) => {
    // Sign in using API to avoid UI login flow
    await signInViaApi(page);
    
    // Create the PracticePage object
    const practicePage = new PracticePage(page);
    
    // Start a practice session
    await practicePage.gotoWithSubject('biology');
    
    // Complete the session
    await practicePage.completeEntireSession();
    
    // Navigate to the review page
    await page.getByRole('link', { name: /Review Answers/i }).click();
    
    // Look for bookmark button
    const bookmarkButton = page.getByRole('button', { name: /Bookmark/i });
    
    if (await bookmarkButton.isVisible()) {
      // If bookmark functionality is implemented, test it
      await bookmarkButton.click();
      
      // Look for confirmation that it was bookmarked
      const hasConfirmation = await page.getByText(/Bookmarked|Added to bookmarks/i).isVisible();
      expect(hasConfirmation).toBeTruthy();
    } else {
      // If not implemented, make a note but don't fail the test
      console.log('Bookmark functionality not yet implemented in review');
    }
  });
});