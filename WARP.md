# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.
``

## Common commands

- Dev server (Next.js App Router)
  - npm run dev
  - Open http://localhost:3000
- Build and start
  - npm run build
  - npm start
- Lint
  - npm run lint
- Unit tests (Vitest)
  - Run all: npm test
  - UI mode: npm run test:ui
  - Single file: npx vitest run path/to/file.test.ts
  - Single test by name: npx vitest -t "test name substring"
- E2E tests (Playwright)
  - Install browsers: npx playwright install
  - Run: npx playwright test
- Database (Drizzle + custom scripts)
  - Generate migrations from schema: npm run db:generate
  - Push migrations (drizzle-kit): npm run db:push
  - Drizzle studio: npm run db:studio
  - Safe custom migration flow (idempotent): npm run db:migrate:safe
  - Full custom migration orchestration: npm run db:migrate:all
  - Verify schema against DB: npm run db:verify
  - Apply SQL migrations directly (uses .env.local XATA_DATABASE_URL): npx tsx src/db/apply-migrations.ts

Notes
- Vitest loads .env.test via src/tests/setup.ts and sets up module mocks via src/tests/vitest-setup.ts.
- QUICK_START.md references scripts/apply-migration.ts; in this repo the entrypoint is src/db/apply-migrations.ts (use the command above).

## High-level architecture

This is a Next.js 15 application using the App Router (src/app) with Clerk for auth, Drizzle ORM for Postgres (Xata connection URL), Stripe for billing, Upstash Redis for caching, Vitest for unit tests, and optional Playwright for E2E.

- App shell and routing
  - src/app contains route groups and server components. Global scaffolding in src/app/layout.tsx; error handling via src/app/global-error.tsx and not-found.tsx.
  - Client providers: src/components/ClientProviders.tsx wraps children with ClerkProvider and a dynamically loaded PerformanceMonitor.
  - Middleware: src/middleware.ts wraps all requests with Clerk auth for non-public routes, sets security headers (CSP, X-Frame-Options, etc.), and tailored Cache-Control per path (static, API, chemistry/biology pages). It also allows a set of mobile API routes (x-client-id starts with flutter- or specific UA) to bypass auth.

- API layer (Next.js Route Handlers)
  - Under src/app/api, grouped endpoints cover admin CRUD for subjects/topics/subtopics/questions and question-papers, practice session lifecycle (/practice-sessions/... including submit, review, summary, bookmark), attempts (/question-attempts), and billing flows (/checkout, /customer-portal).
  - Clerk middleware governs access; mobile clients have a whitelisted set of unauth’d endpoints via middleware.

- Data layer (Drizzle ORM + custom migrations)
  - Schema: src/db/schema.ts defines enums (question_type, question_source_type, difficulty_level, etc.) and tables for subjects/topics/subtopics, questions and tags, practice_sessions/session_questions/question_attempts, topic_mastery, and subscription management (subscription_plans, user_subscriptions, payment_history) with relations.
  - Migrations: SQL files live in drizzle/. Custom scripts provide safe/idempotent application:
    - src/db/apply-migrations.ts scans drizzle SQL, makes CREATE TABLE IF NOT EXISTS adjustments, skips enum re-creates, and records applied hashes in drizzle_migrations.
    - src/db/migrate.ts orchestrates custom steps (custom-migrate → drizzle-kit generate → record-migrations → verify-schema).
    - src/db/verify-schema.ts inspects enums, tables, and drizzle_migrations and reports counts.

- Caching and performance
  - Cache provider (Redis + LRU fallback): src/lib/cache.ts with get/set, deletePattern via Redis SCAN, user key tracking, and helpers withCache / withCacheAdvanced and a Cached method decorator.
  - Performance utilities: src/lib/performance.ts for async timing, trackedQuery, cache hit/miss stats, and Web Vitals reporting. Client-side PerformanceMonitor component initializes monitoring (src/components/PerformanceMonitor.tsx) via utils/performanceMonitor.

- Authentication and user flows
  - Clerk is integrated on client via ClientProviders and on server via middleware.
  - hooks (src/hooks) include subscription state and limits; these gate client features like practice sessions.

- Billing
  - Stripe config in src/config/stripe.ts (API version, flags, currency) and helpers in src/lib/stripe.ts.
  - Server-side Stripe instance guarded on server; client uses loadStripe with NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
  - API routes /api/checkout and /api/customer-portal integrate checkout sessions and customer portal.

- Content and CMS
  - Sanity client: src/sanity/client.ts.
  - Additional educational content (markdown) in content/ is used for subject pages (e.g., biology/chemistry), coordinated with middleware caching rules.

- Error handling and telemetry
  - Error boundary component: src/components/ErrorBoundary.tsx logs via src/lib/logger.
  - Sentry is wired via src/instrumentation.ts and src/instrumentation-client.ts (server/edge/client).

## Important docs in this repo

- README.md: Basic Next.js bootstrapping and dev server instructions.
- QUICK_START.md: One-command database index application for chemistry-page performance; use npx tsx src/db/apply-migrations.ts in this repo.
- OPTIMIZATION_GUIDE.md and related optimization docs: Deep dives on performance, middleware caching, and main-thread optimizations.

## Environment

Set these as needed (see src/lib/env.ts and Stripe/Clerk usage):
- Database: XATA_DATABASE_URL (used by apply/verify scripts via .env.local)
- Clerk: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- Stripe: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY
- Redis (optional but recommended): UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
