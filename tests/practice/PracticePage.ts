// tests/practice/PracticePage.ts
import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Practice page
 * Provides methods to interact with the practice page and its components
 */
export class PracticePage {
  readonly page: Page;
  
  // Page sections
  readonly subjectSelector: Locator;
  readonly questionDisplay: Locator;
  readonly progressBar: Locator;
  readonly questionNavigator: Locator;
  readonly sessionHeader: Locator;
  
  // Subject selection elements
  readonly subjectCards: Locator;
  
  // Question elements - common
  readonly questionText: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly completeButton: Locator;
  
  // Question type specific elements
  readonly multipleChoiceOptions: Locator;
  readonly matchingOptions: Locator;
  readonly assertionReasonOptions: Locator;
  readonly multipleCorrectOptions: Locator;
  readonly sequenceOrderingOptions: Locator;
  readonly diagramBasedOptions: Locator;
  
  // Session completion elements
  readonly sessionSummary: Locator;
  readonly startNewSessionButton: Locator;
  
  // Subscription limit notification
  readonly limitNotification: Locator;
  readonly upgradeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main page sections
    this.subjectSelector = page.locator('.container').filter({ hasText: 'Select a Subject' });
    this.questionDisplay = page.locator('[data-test-id="question-display"]');
    this.progressBar = page.locator('.h-2\\.5.rounded-full');
    this.questionNavigator = page.locator('[data-test-id="question-navigator"]');
    this.sessionHeader = page.locator('h1.text-2xl');
    
    // Subject selection elements
    this.subjectCards = page.locator('[data-test-id="subject-card"]');
    
    // Question elements - common
    this.questionText = page.locator('[data-test-id="question-text"]');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.previousButton = page.getByRole('button', { name: 'Previous' });
    this.completeButton = page.getByRole('button', { name: 'Complete Session' });
    
    // Question type specific elements
    this.multipleChoiceOptions = page.locator('[data-test-id="multiple-choice-option"]');
    this.matchingOptions = page.locator('[data-test-id="matching-option"]');
    this.assertionReasonOptions = page.locator('[data-test-id="assertion-reason-option"]');
    this.multipleCorrectOptions = page.locator('[data-test-id="multiple-correct-option"]');
    this.sequenceOrderingOptions = page.locator('[data-test-id="sequence-ordering-option"]');
    this.diagramBasedOptions = page.locator('[data-test-id="diagram-based-option"]');
    
    // Session completion elements
    this.sessionSummary = page.locator('[data-test-id="session-summary"]');
    this.startNewSessionButton = page.getByRole('button', { name: 'Start New Session' });
    
    // Subscription limit notification
    this.limitNotification = page.locator('[data-test-id="subscription-limit-notification"]');
    this.upgradeButton = page.getByRole('link', { name: 'Upgrade to Premium' });
  }

  /**
   * Navigate to the practice page
   */
  async goto() {
    await this.page.goto('/practice');
  }

  /**
   * Navigate to the practice page with a specific subject
   */
  async gotoWithSubject(subjectName: string) {
    const subjectLower = subjectName.toLowerCase();
    await this.page.goto(`/practice?subject=${subjectLower}`);
  }

  /**
   * Navigate to the practice page with specific topic
   */
  async gotoWithTopic(subjectName: string, topicId: number) {
    const subjectLower = subjectName.toLowerCase();
    await this.page.goto(`/practice?subject=${subjectLower}&topicId=${topicId}`);
  }

  /**
   * Select a subject from the subject selector
   */
  async selectSubject(subjectName: string) {
    await this.subjectCards.filter({ hasText: subjectName }).click();
    // Wait for the session to load
    await this.page.waitForResponse(response => 
      response.url().includes('/api/practice-sessions') && response.status() === 200
    );
    // Wait for the first question to be visible
    await this.questionText.waitFor({ state: 'visible' });
  }

  /**
   * Get current question number (1-based)
   */
  async getCurrentQuestionNumber(): Promise<number> {
    const questionCountText = await this.page.locator('text=Question').first().textContent();
    const match = questionCountText?.match(/Question (\d+) of \d+/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Get total questions count
   */
  async getTotalQuestionsCount(): Promise<number> {
    const questionCountText = await this.page.locator('text=Question').first().textContent();
    const match = questionCountText?.match(/Question \d+ of (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get current question type
   */
  async getCurrentQuestionType(): Promise<string> {
    const questionDisplayClass = await this.questionDisplay.getAttribute('class');
    
    if (await this.page.locator('[data-test-id="multiple-choice-question"]').isVisible()) {
      return 'MultipleChoice';
    } else if (await this.page.locator('[data-test-id="matching-question"]').isVisible()) {
      return 'Matching';
    } else if (await this.page.locator('[data-test-id="assertion-reason-question"]').isVisible()) {
      return 'AssertionReason';
    } else if (await this.page.locator('[data-test-id="multiple-correct-statements-question"]').isVisible()) {
      return 'MultipleCorrectStatements';
    } else if (await this.page.locator('[data-test-id="sequence-ordering-question"]').isVisible()) {
      return 'SequenceOrdering';
    } else if (await this.page.locator('[data-test-id="diagram-based-question"]').isVisible()) {
      return 'DiagramBased';
    }
    
    return 'Unknown';
  }

  /**
   * Select an option for the current question
   * @param optionIndex The 0-based index of the option to select
   */
  async selectOption(optionIndex: number) {
    const questionType = await this.getCurrentQuestionType();
    
    switch (questionType) {
      case 'MultipleChoice':
        await this.multipleChoiceOptions.nth(optionIndex).click();
        break;
      case 'Matching':
        await this.matchingOptions.nth(optionIndex).click();
        break;
      case 'AssertionReason':
        await this.assertionReasonOptions.nth(optionIndex).click();
        break;
      case 'MultipleCorrectStatements':
        await this.multipleCorrectOptions.nth(optionIndex).click();
        break;
      case 'SequenceOrdering':
        await this.sequenceOrderingOptions.nth(optionIndex).click();
        break;
      case 'DiagramBased':
        await this.diagramBasedOptions.nth(optionIndex).click();
        break;
      default:
        throw new Error(`Unknown question type: ${questionType}`);
    }
  }

  /**
   * Navigate to the next question
   */
  async nextQuestion() {
    await this.nextButton.click();
  }

  /**
   * Navigate to the previous question
   */
  async previousQuestion() {
    await this.previousButton.click();
  }

  /**
   * Navigate to a specific question by index (1-based)
   */
  async goToQuestion(questionNumber: number) {
    await this.questionNavigator.locator(`[data-test-id="question-button-${questionNumber}"]`).click();
  }

  /**
   * Complete the session
   * If not all questions are answered, it will confirm the dialog
   */
  async completeSession() {
    await this.completeButton.click();
    
    // Handle confirmation dialog if it appears
    try {
      // Try to detect if a confirm dialog is shown
      await this.page.once('dialog', dialog => dialog.accept());
    } catch (e) {
      // If no dialog appears, continue
    }
    
    // Wait for the summary page to load
    await this.sessionSummary.waitFor({ state: 'visible' });
  }

  /**
   * Start a new session from the session summary page
   */
  async startNewSession() {
    await this.startNewSessionButton.click();
    // Wait for the subject selector or first question to be visible
    try {
      await this.page.waitForResponse(response => 
        response.url().includes('/api/practice-sessions') && response.status() === 200
      );
    } catch (e) {
      // If the API call doesn't happen (e.g., returning to subject selection), continue
    }
  }

  /**
   * Answer all questions randomly and complete the session
   */
  async completeEntireSession() {
    const totalQuestions = await this.getTotalQuestionsCount();
    
    for (let i = 0; i < totalQuestions; i++) {
      const questionType = await this.getCurrentQuestionType();
      
      // Select a random option (0-3 for most question types)
      const randomOption = Math.floor(Math.random() * 4);
      await this.selectOption(randomOption);
      
      // If this is not the last question, go to next
      if (i < totalQuestions - 1) {
        await this.nextQuestion();
      } else {
        await this.completeSession();
      }
    }
  }

  /**
   * Check if subscription limit notification is visible
   */
  async hasSubscriptionLimitNotification(): Promise<boolean> {
    return await this.limitNotification.isVisible();
  }

  /**
   * Click the upgrade button on the subscription limit notification
   */
  async clickUpgradeButton() {
    await this.upgradeButton.click();
  }
}