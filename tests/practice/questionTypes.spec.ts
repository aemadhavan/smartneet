// tests/practice/questionTypes.spec.ts
import { test, expect } from '@playwright/test';
import { PracticePage } from './PracticePage';
import { signInViaApi } from '../utils/authUtils';

/**
 * Test suite for specific question types in the practice module
 * 
 * Note: These tests use a strategy to find specific question types
 * by iterating through questions in a session until the desired type is found.
 * This approach is necessary because we don't control which questions are returned
 * in a real practice session.
 */
test.describe('Question Type Tests', () => {
  let practicePage: PracticePage;

  // Setup: Run before each test
  test.beforeEach(async ({ page }) => {
    // Sign in using API to avoid UI login flow
    await signInViaApi(page);
    
    // Create the PracticePage object
    practicePage = new PracticePage(page);
    
    // Navigate to the biology practice page
    await practicePage.gotoWithSubject('biology');
  });

  /**
   * Helper function to find a specific question type
   * Returns true if the type was found, false otherwise
   */
  async function findQuestionType(
    targetType: string, 
    maxQuestions: number = 10
  ): Promise<boolean> {
    let currentQuestion = 1;
    
    while (currentQuestion <= maxQuestions) {
      const questionType = await practicePage.getCurrentQuestionType();
      
      if (questionType === targetType) {
        return true;
      }
      
      // Go to next question if possible
      if (currentQuestion < maxQuestions) {
        await practicePage.nextQuestion();
        currentQuestion++;
      } else {
        break;
      }
    }
    
    return false;
  }

  // Test Multiple Choice questions
  test('should handle Multiple Choice questions correctly', async ({ page }) => {
    // Look for a Multiple Choice question
    const found = await findQuestionType('MultipleChoice');
    
    if (!found) {
      test.skip(true, 'No Multiple Choice questions found in this session');
      return;
    }
    
    // Now we have a Multiple Choice question
    expect(await practicePage.getCurrentQuestionType()).toBe('MultipleChoice');
    
    // Verify expected elements
    await expect(practicePage.multipleChoiceOptions.first()).toBeVisible();
    
    // Select an option
    await practicePage.selectOption(0);
    
    // Verify the option is selected (the specific CSS would depend on implementation)
    await expect(practicePage.multipleChoiceOptions.first()).toHaveClass(/selected/);
    
    // Navigate to next question to ensure selection is saved
    const currentQuestionNumber = await practicePage.getCurrentQuestionNumber();
    await practicePage.nextQuestion();
    
    // Go back to the question
    await practicePage.previousQuestion();
    
    // Verify we're back on the same question and the selection is preserved
    expect(await practicePage.getCurrentQuestionNumber()).toBe(currentQuestionNumber);
    await expect(practicePage.multipleChoiceOptions.first()).toHaveClass(/selected/);
  });

  // Test Matching questions
  test('should handle Matching questions correctly', async ({ page }) => {
    // Look for a Matching question
    const found = await findQuestionType('Matching');
    
    if (!found) {
      test.skip(true, 'No Matching questions found in this session');
      return;
    }
    
    // Now we have a Matching question
    expect(await practicePage.getCurrentQuestionType()).toBe('Matching');
    
    // Verify expected elements
    await expect(practicePage.matchingOptions.first()).toBeVisible();
    
    // Select an option
    await practicePage.selectOption(0);
    
    // Verify the option is selected (the specific CSS would depend on implementation)
    await expect(practicePage.matchingOptions.first()).toHaveClass(/selected/);
  });

  // Test Assertion Reason questions
  test('should handle Assertion Reason questions correctly', async ({ page }) => {
    // Look for an Assertion Reason question
    const found = await findQuestionType('AssertionReason');
    
    if (!found) {
      test.skip(true, 'No Assertion Reason questions found in this session');
      return;
    }
    
    // Now we have an Assertion Reason question
    expect(await practicePage.getCurrentQuestionType()).toBe('AssertionReason');
    
    // Verify expected elements - should show two statements
    await expect(page.getByText(/Assertion/)).toBeVisible();
    await expect(page.getByText(/Reason/)).toBeVisible();
    await expect(practicePage.assertionReasonOptions.first()).toBeVisible();
    
    // Select an option
    await practicePage.selectOption(0);
    
    // Verify the option is selected
    await expect(practicePage.assertionReasonOptions.first()).toHaveClass(/selected/);
  });

  // Test Multiple Correct Statements questions
  test('should handle Multiple Correct Statements questions correctly', async ({ page }) => {
    // Look for a Multiple Correct Statements question
    const found = await findQuestionType('MultipleCorrectStatements');
    
    if (!found) {
      test.skip(true, 'No Multiple Correct Statements questions found in this session');
      return;
    }
    
    // Now we have a Multiple Correct Statements question
    expect(await practicePage.getCurrentQuestionType()).toBe('MultipleCorrectStatements');
    
    // Verify expected elements - should show numbered statements
    await expect(practicePage.multipleCorrectOptions.first()).toBeVisible();
    
    // Select an option
    await practicePage.selectOption(0);
    
    // Verify the option is selected
    await expect(practicePage.multipleCorrectOptions.first()).toHaveClass(/selected/);
  });

  // Test Sequence Ordering questions
  test('should handle Sequence Ordering questions correctly', async ({ page }) => {
    // Look for a Sequence Ordering question
    const found = await findQuestionType('SequenceOrdering');
    
    if (!found) {
      test.skip(true, 'No Sequence Ordering questions found in this session');
      return;
    }
    
    // Now we have a Sequence Ordering question
    expect(await practicePage.getCurrentQuestionType()).toBe('SequenceOrdering');
    
    // Verify expected elements - should show sequence items
    await expect(practicePage.sequenceOrderingOptions.first()).toBeVisible();
    
    // Select an option
    await practicePage.selectOption(0);
    
    // Verify the option is selected
    await expect(practicePage.sequenceOrderingOptions.first()).toHaveClass(/selected/);
  });

  // Test Diagram Based questions
  test('should handle Diagram Based questions correctly', async ({ page }) => {
    // Look for a Diagram Based question
    const found = await findQuestionType('DiagramBased');
    
    if (!found) {
      test.skip(true, 'No Diagram Based questions found in this session');
      return;
    }
    
    // Now we have a Diagram Based question
    expect(await practicePage.getCurrentQuestionType()).toBe('DiagramBased');
    
    // Verify expected elements - should show an image
    await expect(page.locator('img')).toBeVisible();
    await expect(practicePage.diagramBasedOptions.first()).toBeVisible();
    
    // Select an option
    await practicePage.selectOption(0);
    
    // Verify the option is selected
    await expect(practicePage.diagramBasedOptions.first()).toHaveClass(/selected/);
  });
});