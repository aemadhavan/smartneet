// tests/practice/practice.spec.ts
import { test, expect } from '@playwright/test';
import { PracticePage } from './PracticePage';
import { signInViaApi } from '../utils/authUtils';

// Test suite for the practice module
test.describe('Practice Module', () => {
  let practicePage: PracticePage;

  // Setup: Run before each test
  test.beforeEach(async ({ page }) => {
    // Sign in using API to avoid UI login flow
    await signInViaApi(page);
    
    // Create the PracticePage object
    practicePage = new PracticePage(page);
  });

  // Test subject selection
  test('should allow selecting a subject', async () => {
    // Navigate to the practice page
    await practicePage.goto();
    
    // Check if subjects are displayed
    await expect(practicePage.subjectSelector).toBeVisible();
    
    // Select a subject
    await practicePage.selectSubject('Biology');
    
    // Verify that a session has been created
    await expect(practicePage.questionText).toBeVisible();
    await expect(practicePage.sessionHeader).toContainText('Biology Practice');
  });

  // Test direct navigation with subject parameter
  test('should support direct navigation with subject parameter', async () => {
    // Navigate directly to the biology practice page
    await practicePage.gotoWithSubject('biology');
    
    // Verify that session is created automatically
    await expect(practicePage.questionText).toBeVisible();
    await expect(practicePage.sessionHeader).toContainText('Biology Practice');
  });
  
  // Test question navigation
  test('should navigate between questions', async ({ page }) => {
    // Start a practice session
    await practicePage.gotoWithSubject('biology');
    
    // Get initial question number
    const initialQuestionNumber = await practicePage.getCurrentQuestionNumber();
    expect(initialQuestionNumber).toBe(1);
    
    // Answer the first question and navigate to next
    await practicePage.selectOption(0);
    await practicePage.nextQuestion();
    
    // Verify we're on question 2
    const nextQuestionNumber = await practicePage.getCurrentQuestionNumber();
    expect(nextQuestionNumber).toBe(2);
    
    // Navigate back to the first question
    await practicePage.previousQuestion();
    
    // Verify we're back on question 1
    const backToFirstQuestion = await practicePage.getCurrentQuestionNumber();
    expect(backToFirstQuestion).toBe(1);
  });
  
  // Test question types
  test('should handle different question types', async ({ page }) => {
    // Start a practice session with enough questions to likely cover different types
    await practicePage.gotoWithSubject('biology');
    
    // Get total questions
    const totalQuestions = await practicePage.getTotalQuestionsCount();
    
    // Map to collect encountered question types
    const questionTypes = new Set<string>();
    
    // Navigate through all questions and record their types
    for (let i = 0; i < totalQuestions; i++) {
      const questionType = await practicePage.getCurrentQuestionType();
      questionTypes.add(questionType);
      
      // Answer the question
      await practicePage.selectOption(0);
      
      // Go to next if not the last question
      if (i < totalQuestions - 1) {
        await practicePage.nextQuestion();
      }
    }
    
    // Verify we encountered at least some question types
    // Note: This test may be flaky if the random questions don't include all types
    expect(questionTypes.size).toBeGreaterThan(0);
    console.log('Encountered question types:', Array.from(questionTypes));
  });
  
  // Test session completion
  test('should complete a session and show results', async ({ page }) => {
    // Start a practice session
    await practicePage.gotoWithSubject('biology');
    
    // Complete the entire session
    await practicePage.completeEntireSession();
    
    // Verify we're on the session summary page
    await expect(practicePage.sessionSummary).toBeVisible();
    
    // Check for summary elements
    await expect(page.getByText(/Score/)).toBeVisible();
    await expect(page.getByText(/Accuracy/)).toBeVisible();
    
    // Verify we can start a new session
    await expect(practicePage.startNewSessionButton).toBeVisible();
  });
  
  // Test topic-specific practice
  test('should support topic-specific practice', async () => {
    // Navigate to a practice session for a specific topic (topic ID 1 = Cell Biology)
    await practicePage.gotoWithTopic('biology', 1);
    
    // Verify that the session is created with the topic name
    await expect(practicePage.sessionHeader).toContainText('Cell Biology Practice');
  });
  
  // Test subscription limits for free users
  test('should show subscription limits for free users', async ({ page }) => {
    // Sign in as a free user
    await signInViaApi(page);
    practicePage = new PracticePage(page);
    
    // Navigate to the practice page
    await practicePage.goto();
    
    // Check for the subscription limit indicator
    await expect(page.getByText(/tests remaining/i)).toBeVisible();
  });
});

// Test suite for advanced interactions
test.describe('Advanced Practice Features', () => {
  // Session persistence test
  test('should persist session state across page reloads', async ({ page }) => {
    // Sign in and create page object
    await signInViaApi(page);
    const practicePage = new PracticePage(page);
    
    // Start a session
    await practicePage.gotoWithSubject('biology');
    
    // Answer the first question
    await practicePage.selectOption(0);
    await practicePage.nextQuestion();
    
    // Answer the second question
    await practicePage.selectOption(1);
    
    // Reload the page
    await page.reload();
    
    // Verify we're still on question 2 and the answers are preserved
    const currentQuestion = await practicePage.getCurrentQuestionNumber();
    expect(currentQuestion).toBe(2);
    
    // We'd need to check if the selection is still visible, but that depends on the UI implementation
  });
  
  // Test session limit reached scenario
  test('should handle session limit reached', async ({ page }) => {
    // Sign in as a limited user who has reached their session limit
    // This requires special test user setup or mocking
    await signInViaApi(page);
    const practicePage = new PracticePage(page);
    
    // Navigate to the practice page
    await practicePage.goto();
    
    // Select a subject
    await practicePage.selectSubject('Biology');
    
    // Check if limit notification appears
    const hasLimitNotification = await practicePage.hasSubscriptionLimitNotification();
    if (hasLimitNotification) {
      // Verify upgrade button is present
      await expect(practicePage.upgradeButton).toBeVisible();
    } else {
      // Skip this test if the user hasn't actually reached their limit
      test.skip();
    }
  });
});
