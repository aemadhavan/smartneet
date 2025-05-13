// tests/practice/mockQuestionTypes.spec.ts
import { test, expect } from '@playwright/test';
import { PracticePage } from './PracticePage';
import { signInViaApi } from '../utils/authUtils';
import { mockSpecificQuestionType } from '../utils/practiceMocks';

/**
 * This test suite uses mocks to ensure we can test each question type.
 * Unlike the regular questionTypes.spec.ts which relies on finding the
 * right question types in real session data, this test guarantees
 * we can test specific question types by mocking the API response.
 */
test.describe('Mocked Question Type Tests', () => {
  // Test each question type by mocking the API response
  const questionTypes = [
    'MultipleChoice',
    'Matching',
    'AssertionReason',
    'MultipleCorrectStatements',
    'SequenceOrdering',
    'DiagramBased'
  ];
  
  for (const questionType of questionTypes) {
    test(`should handle ${questionType} questions correctly`, async ({ page }) => {
      // Sign in using API
      await signInViaApi(page);
      
      // Create the PracticePage object
      const practicePage = new PracticePage(page);
      
      // Mock specific question type to ensure we get this type
      await mockSpecificQuestionType(page, questionType);
      
      // Navigate to the practice page
      await practicePage.gotoWithSubject('biology');
      
      // Verify we have the expected question type
      expect(await practicePage.getCurrentQuestionType()).toBe(questionType);
      
      // Select an option
      await practicePage.selectOption(0);
      
      // Complete the session
      await practicePage.completeSession();
      
      // Verify we're on the summary page
      await expect(page.getByText(/Session Summary/i)).toBeVisible();
    });
  }

  // Test that each question type renders correctly
  test('should render multiple choice questions correctly', async ({ page }) => {
    await signInViaApi(page);
    const practicePage = new PracticePage(page);
    
    await mockSpecificQuestionType(page, 'MultipleChoice');
    await practicePage.gotoWithSubject('biology');
    
    // Verify question type
    expect(await practicePage.getCurrentQuestionType()).toBe('MultipleChoice');
    
    // Verify question elements
    await expect(page.locator('[data-test-id="multiple-choice-question"]')).toBeVisible();
    
    // Verify options count (should be 4 for our mock)
    expect(await page.locator('[data-test-id="multiple-choice-option"]').count()).toBe(4);
  });
  
  test('should render matching questions correctly', async ({ page }) => {
    await signInViaApi(page);
    const practicePage = new PracticePage(page);
    
    await mockSpecificQuestionType(page, 'Matching');
    await practicePage.gotoWithSubject('biology');
    
    // Verify question type
    expect(await practicePage.getCurrentQuestionType()).toBe('Matching');
    
    // Verify question elements
    await expect(page.locator('[data-test-id="matching-question"]')).toBeVisible();
    
    // Verify it shows the column headers
    await expect(page.getByText('Column A')).toBeVisible();
    await expect(page.getByText('Column B')).toBeVisible();
  });
  
  test('should render assertion reason questions correctly', async ({ page }) => {
    await signInViaApi(page);
    const practicePage = new PracticePage(page);
    
    await mockSpecificQuestionType(page, 'AssertionReason');
    await practicePage.gotoWithSubject('biology');
    
    // Verify question type
    expect(await practicePage.getCurrentQuestionType()).toBe('AssertionReason');
    
    // Verify question elements
    await expect(page.locator('[data-test-id="assertion-reason-question"]')).toBeVisible();
    
    // Verify it shows the assertion and reason statements
    await expect(page.getByText('Assertion')).toBeVisible();
    await expect(page.getByText('Reason')).toBeVisible();
  });
  
  test('should render multiple correct statements questions correctly', async ({ page }) => {
    await signInViaApi(page);
    const practicePage = new PracticePage(page);
    
    await mockSpecificQuestionType(page, 'MultipleCorrectStatements');
    await practicePage.gotoWithSubject('biology');
    
    // Verify question type
    expect(await practicePage.getCurrentQuestionType()).toBe('MultipleCorrectStatements');
    
    // Verify question elements
    await expect(page.locator('[data-test-id="multiple-correct-statements-question"]')).toBeVisible();
    
    // Verify it shows the statements
    await expect(page.getByText('Statement 1')).toBeVisible();
    await expect(page.getByText('Statement 2')).toBeVisible();
  });
  
  test('should render sequence ordering questions correctly', async ({ page }) => {
    await signInViaApi(page);
    const practicePage = new PracticePage(page);
    
    await mockSpecificQuestionType(page, 'SequenceOrdering');
    await practicePage.gotoWithSubject('biology');
    
    // Verify question type
    expect(await practicePage.getCurrentQuestionType()).toBe('SequenceOrdering');
    
    // Verify question elements
    await expect(page.locator('[data-test-id="sequence-ordering-question"]')).toBeVisible();
    
    // Verify it shows the sequence items
    await expect(page.getByText('Step 1')).toBeVisible();
    await expect(page.getByText('Step 2')).toBeVisible();
  });
  
  test('should render diagram based questions correctly', async ({ page }) => {
    await signInViaApi(page);
    const practicePage = new PracticePage(page);
    
    await mockSpecificQuestionType(page, 'DiagramBased');
    await practicePage.gotoWithSubject('biology');
    
    // Verify question type
    expect(await practicePage.getCurrentQuestionType()).toBe('DiagramBased');
    
    // Verify question elements
    await expect(page.locator('[data-test-id="diagram-based-question"]')).toBeVisible();
    
    // Verify it shows the diagram
    await expect(page.locator('img')).toBeVisible();
    
    // Verify it shows the label
    await expect(page.getByText('X')).toBeVisible();
  });
});