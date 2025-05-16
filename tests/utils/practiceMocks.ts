// tests/utils/practiceMocks.ts
import { Page } from '@playwright/test';

/**
 * Mock subscription limit reached response
 * Use this to test how the UI handles when a user has reached their practice limit
 */
export async function mockSubscriptionLimitReached(page: Page) {
  // Add route interception for practice session creation
  await page.route('**/api/practice-sessions', route => {
    // Return a 403 response with limit reached message
    route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        error: "You've reached your daily practice limit. Upgrade to Premium for unlimited practice tests.",
        limitReached: true,
        upgradeRequired: true
      })
    });
  });
}

/**
 * Mock subscription limit status
 * @param page Playwright page
 * @param status Subscription status object
 */
export async function mockSubscriptionLimitStatus(
  page: Page, 
  status: { canTake: boolean, remaining: number, max: number, reason?: string }
) {
  // Add route interception for subscription limit check
  await page.route('**/api/user/test-limits', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(status)
    });
  });
}

/**
 * Create helpers for tracking API calls made during tests
 */
export async function trackAPIRequests(page: Page) {
  const requests: { url: string, method: string, status: number }[] = [];
  
  // Track API requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        status: -1 // Not yet completed
      });
    }
  });
  
  // Track API responses
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      const requestIndex = requests.findIndex(
        req => req.url === response.url() && req.status === -1
      );
      
      if (requestIndex !== -1) {
        requests[requestIndex].status = response.status();
      }
    }
  });
  
  // Return a function to get the tracked requests
  return () => requests;
}

/**
 * Mock an error response for a specific API endpoint
 */
export async function mockAPIError(page: Page, endpoint: string, status: number, errorMessage: string) {
  await page.route(`**/api/${endpoint}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: errorMessage })
    });
  });
}

/**
 * Mock specific question types to ensure tests for each type can run
 * This mocks the practice-sessions API to return a session with 
 * a specific question type for targeted testing
 */
export async function mockSpecificQuestionType(page: Page, questionType: string) {
  await page.route('**/api/practice-sessions', route => {
    // Generate a mock question based on the requested type
    const mockQuestion = createMockQuestion(questionType);
    
    // Create a mock session with this question
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 9999,
        questions: [mockQuestion]
      })
    });
  });
}

/**
 * Create a mock question for a specific type
 */
function createMockQuestion(questionType: string) {
  const baseQuestion = {
    question_id: 9999,
    topic_id: 1,
    topic_name: 'Test Topic',
    subtopic_id: 1,
    subtopic_name: 'Test Subtopic',
    explanation: 'This is a mock explanation for testing purposes.',
    difficulty_level: 'medium',
    marks: 1,
    negative_marks: 0.25,
  };
  
  switch (questionType) {
    case 'MultipleChoice':
      return {
        ...baseQuestion,
        question_text: 'This is a test multiple choice question?',
        question_type: 'MultipleChoice',
        details: {
          options: [
            { option_number: 'A', option_text: 'Option A' },
            { option_number: 'B', option_text: 'Option B' },
            { option_number: 'C', option_text: 'Option C' },
            { option_number: 'D', option_text: 'Option D' }
          ]
        }
      };
      
    case 'Matching':
      return {
        ...baseQuestion,
        question_text: 'Match the following items:',
        question_type: 'Matching',
        details: {
          left_column_header: 'Column A',
          right_column_header: 'Column B',
          items: [
            { left_item_label: 'P', left_item_text: 'Item P', right_item_label: '1', right_item_text: 'Item 1' },
            { left_item_label: 'Q', left_item_text: 'Item Q', right_item_label: '2', right_item_text: 'Item 2' },
            { left_item_label: 'R', left_item_text: 'Item R', right_item_label: '3', right_item_text: 'Item 3' },
            { left_item_label: 'S', left_item_text: 'Item S', right_item_label: '4', right_item_text: 'Item 4' }
          ],
          options: [
            { option_number: 'A', option_text: 'P-1, Q-2, R-3, S-4' },
            { option_number: 'B', option_text: 'P-1, Q-3, R-2, S-4' },
            { option_number: 'C', option_text: 'P-4, Q-3, R-2, S-1' },
            { option_number: 'D', option_text: 'P-2, Q-1, R-4, S-3' }
          ]
        }
      };
      
    case 'AssertionReason':
      return {
        ...baseQuestion,
        question_text: 'Assertion and Reason:',
        question_type: 'AssertionReason',
        details: {
          statements: [
            { statement_label: 'Assertion', statement_text: 'This is a test assertion statement.' },
            { statement_label: 'Reason', statement_text: 'This is a test reason statement.' }
          ],
          options: [
            { option_number: 'A', option_text: 'Both Assertion and Reason are true and Reason is the correct explanation of Assertion.' },
            { option_number: 'B', option_text: 'Both Assertion and Reason are true but Reason is not the correct explanation of Assertion.' },
            { option_number: 'C', option_text: 'Assertion is true but Reason is false.' },
            { option_number: 'D', option_text: 'Assertion is false but Reason is true.' }
          ]
        }
      };
      
    case 'MultipleCorrectStatements':
      return {
        ...baseQuestion,
        question_text: 'Which of the following statements are correct?',
        question_type: 'MultipleCorrectStatements',
        details: {
          statements: [
            { statement_label: '1', statement_text: 'Statement 1' },
            { statement_label: '2', statement_text: 'Statement 2' },
            { statement_label: '3', statement_text: 'Statement 3' },
            { statement_label: '4', statement_text: 'Statement 4' }
          ],
          options: [
            { option_number: 'A', option_text: '1 and 2 only' },
            { option_number: 'B', option_text: '2 and 3 only' },
            { option_number: 'C', option_text: '1, 3 and 4 only' },
            { option_number: 'D', option_text: 'All of the above' }
          ]
        }
      };
      
    case 'SequenceOrdering':
      return {
        ...baseQuestion,
        question_text: 'Arrange the following in the correct sequence:',
        question_type: 'SequenceOrdering',
        details: {
          sequence_items: [
            { item_number: '1', item_text: 'Step 1' },
            { item_number: '2', item_text: 'Step 2' },
            { item_number: '3', item_text: 'Step 3' },
            { item_number: '4', item_text: 'Step 4' }
          ],
          options: [
            { option_number: 'A', option_text: '1 → 2 → 3 → 4' },
            { option_number: 'B', option_text: '4 → 3 → 2 → 1' },
            { option_number: 'C', option_text: '1 → 3 → 2 → 4' },
            { option_number: 'D', option_text: '2 → 4 → 1 → 3' }
          ]
        }
      };
      
    case 'DiagramBased':
      return {
        ...baseQuestion,
        question_text: 'Identify the structure labeled "X" in the diagram:',
        question_type: 'DiagramBased',
        details: {
          diagram_url: '/images/test-diagram.png',
          labels: [
            { label_id: 'X', label_text: 'X', x_position: 50, y_position: 50 }
          ],
          options: [
            { option_number: 'A', option_text: 'Structure A' },
            { option_number: 'B', option_text: 'Structure B' },
            { option_number: 'C', option_text: 'Structure C' },
            { option_number: 'D', option_text: 'Structure D' }
          ]
        },
        is_image_based: true,
        image_url: '/images/test-diagram.png'
      };
      
    default:
      return {
        ...baseQuestion,
        question_text: 'This is a test question',
        question_type: 'MultipleChoice',
        details: {
          options: [
            { option_number: 'A', option_text: 'Option A' },
            { option_number: 'B', option_text: 'Option B' },
            { option_number: 'C', option_text: 'Option C' },
            { option_number: 'D', option_text: 'Option D' }
          ]
        }
      };
  }
}