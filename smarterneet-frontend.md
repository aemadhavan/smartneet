# SmartNeet Frontend Documentation

This document provides comprehensive documentation of all 29 frontend routes in the SmartNeet application and their API consumption patterns.

## Application Overview

SmartNeet is a comprehensive NEET exam preparation platform built with Next.js 14+ featuring:
- Interactive practice sessions
- Topic mastery tracking
- Subscription management
- Study guides and resources
- User dashboard with analytics

## Route Documentation

### Static Pages (No API Consumption)

#### 1. **/ (Home Page)**
- **File**: `/src/app/page.tsx`
- **Purpose**: Landing page with hero section, features showcase, and call-to-action
- **Features**: Dynamic imports, responsive design, marketing content
- **APIs Consumed**: None

#### 2. **/_not-found**
- **File**: `/src/app/not-found.tsx`
- **Purpose**: Custom 404 error page
- **Features**: User-friendly error messaging with navigation
- **APIs Consumed**: None

#### 3. **/about-us**
- **File**: `/src/app/about-us/page.tsx`
- **Purpose**: Company information, mission, and team details
- **Features**: Static content with responsive layout
- **APIs Consumed**: None

#### 4. **/biology**
- **File**: `/src/app/biology/page.tsx`
- **Purpose**: Biology subject overview with Botany and Zoology navigation
- **Features**: Subject introduction, topic links
- **APIs Consumed**: None

#### 9. **/cookie-policy**
- **File**: `/src/app/cookie-policy/page.tsx`
- **Purpose**: Cookie usage policy and compliance information
- **Features**: Legal document with markdown rendering
- **APIs Consumed**: None

#### 19. **/privacy-policy**
- **File**: `/src/app/privacy-policy/page.tsx`
- **Purpose**: Privacy policy and data protection information
- **Features**: Legal document with comprehensive privacy details
- **APIs Consumed**: None

#### 24. **/smarter-guides**
- **File**: `/src/app/smarter-guides/page.tsx`
- **Purpose**: Study guides overview and navigation
- **Features**: Guide categories, topic navigation
- **APIs Consumed**: None

#### 25. **/smarter-guides/botany**
- **File**: `/src/app/smarter-guides/botany/BotanyContent.tsx`
- **Purpose**: Botany study guides with topic-wise content
- **Features**: Hardcoded topic data, structured content navigation
- **APIs Consumed**: None

#### 27. **/smarter-guides/zoology**
- **File**: `/src/app/smarter-guides/zoology/page.tsx`
- **Purpose**: Zoology study guides with topic-wise content
- **Features**: Hardcoded topic data, structured content navigation
- **APIs Consumed**: None

#### 29. **/terms-of-service**
- **File**: `/src/app/terms-of-service/page.tsx`
- **Purpose**: Terms of service and user agreement
- **Features**: Legal document with markdown rendering
- **APIs Consumed**: None

### Authentication Pages

#### 22. **/sign-in/[[...sign-in]]**
- **File**: `/src/app/sign-in/[[...sign-in]]/page.tsx`
- **Purpose**: User authentication and login
- **Features**: Clerk.js integration, responsive auth forms
- **APIs Consumed**: External Clerk authentication service

#### 23. **/sign-up/[[...sign-up]]**
- **File**: `/src/app/sign-up/[[...sign-up]]/page.tsx`
- **Purpose**: User registration and account creation
- **Features**: Clerk.js integration, client-side event tracking
- **APIs Consumed**: External Clerk authentication service

### Content & Topic Pages

#### 5. **/biology/bot**
- **File**: `/src/app/biology/bot/page.tsx`
- **Purpose**: Botany topics overview with interactive content
- **Features**: 
  - Dynamic topic loading
  - Premium access control
  - Subtopic expansion
- **APIs Consumed**:
  - `/api/topics?subjectId=3&isRootLevel=true&isActive=true`
  - `/api/subtopics?topicId=${topic.topic_id}&isActive=true`
  - `/api/user/test-limits` (via useSubscriptionLimits)

#### 6. **/biology/bot/topics/[id]**
- **File**: `/src/app/biology/bot/topics/[id]/page.tsx`
- **Purpose**: Individual botany topic details with comprehensive content
- **Features**:
  - Topic-specific content
  - Subtopic breakdown
  - Access control
- **APIs Consumed**:
  - `/api/topics?subjectId=3&isRootLevel=true&isActive=true`
  - `/api/topics/${topicId}`
  - `/api/user/test-limits` (via useSubscriptionLimits)

#### 7. **/biology/zoo**
- **File**: `/src/app/biology/zoo/page.tsx`
- **Purpose**: Zoology topics overview with interactive content
- **Features**:
  - Dynamic topic loading
  - Premium access control
  - Subtopic expansion
- **APIs Consumed**:
  - `/api/topics?subjectId=4&isRootLevel=true&isActive=true`
  - `/api/subtopics?topicId=${topic.topic_id}&isActive=true`
  - `/api/user/test-limits` (via useSubscriptionLimits)

#### 8. **/biology/zoo/topics/[id]**
- **File**: `/src/app/biology/zoo/topics/[id]/page.tsx`
- **Purpose**: Individual zoology topic details with comprehensive content
- **Features**:
  - Topic-specific content
  - Subtopic breakdown
  - Access control
- **APIs Consumed**:
  - `/api/topics?subjectId=4&isRootLevel=true&isActive=true`
  - `/api/topics/${topicId}`
  - `/api/user/test-limits` (via useSubscriptionLimits)

### Dashboard & Analytics Pages

#### 10. **/dashboard**
- **File**: `/src/app/dashboard/page.tsx`
- **Purpose**: Main user dashboard with comprehensive analytics
- **Features**:
  - Performance metrics
  - Recent session history
  - Topic mastery overview
  - Question type distribution
  - Progress charts
- **APIs Consumed**:
  - `/api/practice-sessions?limit=10`
  - `/api/topic-mastery`
  - `/api/user-stats`
  - `/api/question-types`

#### 11. **/dashboard/subscription**
- **File**: `/src/app/dashboard/subscription/page.tsx`
- **Purpose**: Subscription management and billing history
- **Features**:
  - Current subscription details
  - Payment history
  - Stripe customer portal integration
  - Plan upgrade options
- **APIs Consumed**:
  - `/api/user/subscription`
  - `/api/user/payments`
  - `/api/customer-portal` (POST)

#### 12. **/dashboard/topics**
- **File**: `/src/app/dashboard/topics/page.tsx`
- **Purpose**: Detailed topic mastery tracking and analytics
- **Features**:
  - Subject-wise topic breakdown
  - Mastery level indicators
  - Performance metrics
  - Progress visualization
- **APIs Consumed**:
  - `/api/topic-mastery/detailed`
  - `/api/subjects/with-topics`

### Practice & Learning Pages

#### 13. **/practice**
- **File**: `/src/app/practice/client-page.tsx`
- **Purpose**: Main practice session interface
- **Features**:
  - Interactive question answering
  - Real-time session management
  - Timer functionality
  - Answer submission
  - Progress tracking
- **APIs Consumed**:
  - `/api/practice-sessions` (POST)
  - `/api/topics?subjectId=${botanySubjectId}&isRootLevel=true&isActive=true`
  - `/api/practice-sessions/${sessionId}/submit` (POST)
  - `/api/user/test-limits` (via useSubscriptionLimits)

#### 14. **/practice-sessions/[sessionId]/review**
- **File**: `/src/app/practice-sessions/[sessionId]/review/page.tsx`
- **Purpose**: Detailed session review with question analysis
- **Features**:
  - Question-by-question review
  - Correct/incorrect indicators
  - Detailed explanations
  - Performance insights
- **APIs Consumed**:
  - `/api/practice-sessions/${sessionId}/review`
  - `/api/practice-sessions/${sessionId}/summary`

#### 15. **/practice-sessions/[sessionId]/summary**
- **File**: `/src/app/practice-sessions/[sessionId]/summary/page.tsx`
- **Purpose**: Session performance summary with analytics
- **Features**:
  - Overall performance metrics
  - Topic-wise breakdown
  - Time analysis
  - Score visualization
- **APIs Consumed**:
  - `/api/practice-sessions/${sessionId}/summary`

#### 16. **/practice/flashcards**
- **File**: `/src/app/practice/flashcards/page.tsx`
- **Purpose**: Flashcard-style question practice
- **Features**:
  - Swipe-based interface
  - Progress tracking
  - Randomized questions
- **APIs Consumed**: Indirect via QuestionViewer component

#### 17. **/practice/question-browser**
- **File**: `/src/app/practice/question-browser/page.tsx`
- **Purpose**: Browse and practice individual questions
- **Features**:
  - Question navigation
  - Individual question practice
  - Demo implementation
- **APIs Consumed**: Indirect via QuestionViewer component

#### 20. **/questions/[questionId]**
- **File**: `/src/app/questions/[questionId]/question-client-part.tsx`
- **Purpose**: Individual question viewer and answering interface
- **Features**:
  - Single question focus
  - Answer submission
  - Mock implementation
- **APIs Consumed**: Indirect via QuestionViewer component

### Subscription & Billing Pages

#### 18. **/pricing**
- **File**: `/src/app/pricing/page.tsx`
- **Purpose**: Subscription plans and pricing information
- **Features**:
  - Plan comparison
  - Feature highlights
  - Checkout integration
  - Server-side rendering
- **APIs Consumed**:
  - `/api/subscription-plans`

### Session Analysis Pages

#### 21. **/sessions/[sessionId]**
- **File**: `/src/app/sessions/[sessionId]/page.tsx`
- **Purpose**: Detailed session results with performance analytics
- **Features**:
  - Mock data implementation
  - Performance charts
  - Detailed analytics
- **APIs Consumed**: Mock data (designed for `/api/sessions/${sessionId}`)

### Study Guide Content Pages

#### 26. **/smarter-guides/botany/[slug]**
- **Purpose**: Specific botany topic study guides
- **Features**: Markdown content rendering
- **APIs Consumed**: Static content fetching

#### 28. **/smarter-guides/zoology/[slug]**
- **Purpose**: Specific zoology topic study guides
- **Features**: Markdown content rendering
- **APIs Consumed**: Static content fetching

## Custom Hooks & Utilities

### Authentication & Subscription
- **`useSubscriptionLimits`**: Manages subscription status and test limits
- **Uses**: `/api/user/test-limits`

### Practice Sessions
- **`usePracticeSession`**: Complex practice session state management
- **Uses**: Multiple practice session APIs

### Data Fetching
- **`useSubjects`**: Subject data with caching
- **Uses**: `/api/subjects`

- **`useSessionReview`**: Session review data management
- **Uses**: `/api/practice-sessions/${sessionId}/review`

### Utilities
- **`fetchDashboardData`**: Parallel dashboard data fetching
- **Uses**: Multiple dashboard APIs with Promise.all()

## Data Fetching Patterns

1. **Direct fetch calls** in useEffect hooks
2. **Custom hook abstractions** for complex state management
3. **Server-side data fetching** for static content
4. **Parallel API calls** using Promise.all()
5. **Caching strategies** in practice session management
6. **Error handling** with fallback UI states

## Page-API Consumption Summary Table

| Page Name | Consumed APIs |
|-----------|---------------|
| / | None |
| /_not-found | None |
| /about-us | None |
| /biology | None |
| /biology/bot | `/api/topics`, `/api/subtopics`, `/api/user/test-limits` |
| /biology/bot/topics/[id] | `/api/topics`, `/api/user/test-limits` |
| /biology/zoo | `/api/topics`, `/api/subtopics`, `/api/user/test-limits` |
| /biology/zoo/topics/[id] | `/api/topics`, `/api/user/test-limits` |
| /cookie-policy | None |
| /dashboard | `/api/practice-sessions`, `/api/topic-mastery`, `/api/user-stats`, `/api/question-types` |
| /dashboard/subscription | `/api/user/subscription`, `/api/user/payments`, `/api/customer-portal` |
| /dashboard/topics | `/api/topic-mastery/detailed`, `/api/subjects/with-topics` |
| /practice | `/api/practice-sessions`, `/api/topics`, `/api/user/test-limits` |
| /practice-sessions/[sessionId]/review | `/api/practice-sessions/[sessionId]/review`, `/api/practice-sessions/[sessionId]/summary` |
| /practice-sessions/[sessionId]/summary | `/api/practice-sessions/[sessionId]/summary` |
| /practice/flashcards | Indirect via QuestionViewer |
| /practice/question-browser | Indirect via QuestionViewer |
| /pricing | `/api/subscription-plans` |
| /privacy-policy | None |
| /questions/[questionId] | Indirect via QuestionViewer |
| /sessions/[sessionId] | Mock data (designed for `/api/sessions/[sessionId]`) |
| /sign-in/[[...sign-in]] | External Clerk service |
| /sign-up/[[...sign-up]] | External Clerk service |
| /smarter-guides | None |
| /smarter-guides/botany | None |
| /smarter-guides/botany/[slug] | Static content |
| /smarter-guides/zoology | None |
| /smarter-guides/zoology/[slug] | Static content |
| /terms-of-service | None |

## Summary Statistics

- **Total Pages**: 29
- **Pages with API consumption**: 12 (41%)
- **Static pages**: 17 (59%)
- **Most API-heavy pages**: Dashboard (4 APIs), Practice (3+ APIs)
- **Authentication pages**: 2 (using external Clerk service)
- **Content pages with APIs**: 4 (biology sections)
- **Management pages**: 3 (subscription, topics, dashboard)