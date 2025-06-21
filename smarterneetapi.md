# SmartNeet API Documentation

This document lists the APIs that are actively used by the frontend application. Out of 29 total APIs, **18 are currently in use** by the frontend.

## Used APIs (18/29)

### Payment & Subscription APIs

#### 1. `/api/checkout`
- **Method**: POST
- **Used in**: `/src/app/pricing/PricingUserSection.tsx`
- **Purpose**: Creates Stripe checkout session for subscription upgrades
- **Request Body**: 
  ```json
  { "planId": number }
  ```
- **Response**: 
  ```json
  { 
    "redirectUrl": "string", 
    "sessionId": "string" 
  }
  ```

#### 2. `/api/customer-portal`
- **Method**: POST
- **Used in**: 
  - `/src/app/dashboard/subscription/page.tsx`
  - `/src/components/subscription/SubscriptionInfo.tsx`
- **Purpose**: Creates Stripe customer portal session for subscription management
- **Request Body**: 
  ```json
  { 
    "returnUrl": "string",
    "customerId": "string" 
  }
  ```
- **Response**: 
  ```json
  { "url": "string" }
  ```

#### 3. `/api/user/subscription`
- **Method**: GET
- **Used in**: 
  - `/src/app/pricing/PricingUserSection.tsx`
  - `/src/app/dashboard/subscription/page.tsx`
  - `/src/components/subscription/SubscriptionInfo.tsx`
- **Purpose**: Fetch current user subscription details
- **Response**: 
  ```json
  { "subscription": "UserSubscription" }
  ```

#### 4. `/api/user/payments`
- **Method**: GET
- **Used in**: `/src/app/dashboard/subscription/page.tsx`
- **Purpose**: Fetch user payment history for subscription dashboard
- **Response**: 
  ```json
  { "payments": "PaymentHistory[]" }
  ```

#### 5. `/api/user/test-limits`
- **Method**: GET
- **Used in**: `/src/hooks/useSubscriptionLimits.ts`
- **Purpose**: Check user test limits and subscription status
- **Query Params**: `t` (timestamp for cache busting)
- **Response**: 
  ```json
  { 
    "limitStatus": "TestLimitStatus", 
    "subscription": "SubscriptionInfo" 
  }
  ```

### Practice Session APIs

#### 6. `/api/practice-sessions`
- **Methods**: POST (create), GET (fetch)
- **Used in**: 
  - `/src/app/practice/hooks/usePracticeSessionSWR.ts`
  - `/src/lib/dashboard/data-fetching.js`
- **Purpose**: 
  - Create new practice sessions with query params
  - Fetch recent practice sessions for dashboard
- **Query Params**: `subject_id`, `topic_id`, `subtopic_id`, `session_type`, `question_count`, `limit`
- **Response**: Session data with questions

#### 7. `/api/practice-sessions/[sessionId]`
- **Method**: PATCH
- **Used in**: `/src/app/practice/hooks/usePracticeSessionSWR.ts`
- **Purpose**: Force complete/abandon practice session
- **Request Body**: 
  ```json
  { 
    "sessionId": "number", 
    "isCompleted": "boolean" 
  }
  ```

#### 8. `/api/practice-sessions/[sessionId]/review`
- **Method**: GET
- **Used in**: `/src/app/practice-sessions/[sessionId]/review/hooks/useSessionReview.ts`
- **Purpose**: Fetch session review data with question attempts and explanations
- **Response**: 
  ```json
  { 
    "questions": "QuestionAttempt[]", 
    "summary": "SessionSummary" 
  }
  ```

#### 9. `/api/practice-sessions/[sessionId]/submit`
- **Method**: POST
- **Used in**: `/src/app/practice/hooks/usePracticeSessionSWR.ts`
- **Purpose**: Submit answers for practice session evaluation
- **Request Body**: 
  ```json
  { "answers": "Record<number, string>" }
  ```

#### 10. `/api/practice-sessions/[sessionId]/summary`
- **Method**: GET
- **Used in**: 
  - `/src/app/practice-sessions/[sessionId]/summary/page.tsx`
  - `/src/app/practice-sessions/[sessionId]/review/hooks/useSessionReview.ts`
- **Purpose**: Fetch detailed session summary with performance analytics
- **Response**: SessionSummary with topic performance, scores, timing

### Data Fetching APIs

#### 11. `/api/subjects`
- **Method**: GET
- **Used in**: `/src/app/practice/hooks/useSubjects.ts`
- **Purpose**: Fetch active subjects for practice selection
- **Query Params**: `isActive=true`
- **Response**: 
  ```json
  { "data": "Subject[]" }
  ```

#### 12. `/api/subjects/with-topics`
- **Method**: GET
- **Used in**: `/src/app/dashboard/topics/page.tsx`
- **Purpose**: Fetch subjects with topic counts for topics dashboard
- **Response**: Array of SubjectInfo with topic counts

#### 13. `/api/topics`
- **Method**: GET
- **Used in**: `/src/app/biology/bot/page.tsx`
- **Purpose**: Fetch topics for specific subjects
- **Query Params**: `subjectId`, `isRootLevel=true`, `isActive=true`
- **Response**: 
  ```json
  { 
    "success": "boolean", 
    "data": "Topic[]" 
  }
  ```

#### 14. `/api/subtopics`
- **Method**: GET
- **Used in**: `/src/app/biology/bot/page.tsx`
- **Purpose**: Fetch subtopics for specific topics
- **Query Params**: `topicId`, `isActive=true`
- **Response**: 
  ```json
  { 
    "success": "boolean", 
    "data": "Subtopic[]" 
  }
  ```

#### 15. `/api/question-types`
- **Method**: GET
- **Used in**: `/src/lib/dashboard/data-fetching.js`
- **Purpose**: Fetch question type distribution data for dashboard charts
- **Response**: 
  ```json
  [{ "name": "string", "value": "number" }]
  ```

### Analytics & Progress APIs

#### 16. `/api/topic-mastery`
- **Method**: GET
- **Used in**: `/src/lib/dashboard/data-fetching.js`
- **Purpose**: Fetch topic mastery data for dashboard
- **Response**: Array of topic mastery data

#### 17. `/api/topic-mastery/detailed`
- **Method**: GET
- **Used in**: `/src/app/dashboard/topics/page.tsx`
- **Purpose**: Fetch detailed topic mastery with user progress
- **Response**: Array of TopicMastery objects

#### 18. `/api/user-stats`
- **Method**: GET
- **Used in**: `/src/lib/dashboard/data-fetching.js`
- **Purpose**: Fetch comprehensive user statistics for dashboard
- **Response**: User stats object with session counts, accuracy, etc.

## Unused APIs (11/29)

The following APIs exist but are **not currently used** by the frontend:

1. `/api/practice-sessions/[sessionId]/bookmark` - Bookmark functionality not implemented
2. `/api/question-attempts` - Direct question attempts API not used
3. `/api/questions/[questionId]` - Individual question fetching not used
4. `/api/session-questions/lookup` - Session question lookup not used
5. `/api/subjects/by-name` - Subject lookup by name not used
6. `/api/subscription` - Alternative subscription endpoint not used
7. `/api/subscription-plans` - Subscription plans fetched differently
8. `/api/topic-mastery/all` - Alternative mastery endpoint not used
9. `/api/topics/[id]` - Individual topic fetching not used
10. `/api/topics/with-subtopic-counts` - Topics with subtopic counts not used
11. `/api/webhooks/stripe` - Webhook endpoint (not called by frontend)

## API Usage Summary

- **Total APIs**: 29
- **Used by Frontend**: 18 (62%)
- **Unused**: 11 (38%)

### Most Used API Categories:
1. **Practice Sessions** (5 endpoints) - Core functionality
2. **Payment/Subscription** (5 endpoints) - User management
3. **Data Fetching** (4 endpoints) - Dashboard content
4. **Analytics** (3 endpoints) - Progress tracking
5. **Content Management** (1 endpoint) - Question types

The unused APIs may represent legacy endpoints, future features, or alternative data access patterns not currently implemented in the frontend.