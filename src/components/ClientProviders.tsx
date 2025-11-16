'use client';

/**
 * Client-side providers wrapper
 * OPTIMIZED: Enhanced loading strategy to reduce main-thread work
 * - PerformanceMonitor: Loaded dynamically with no SSR
 * - ClerkProvider: Imported directly and wrapped in Suspense to handle internal boundaries
 */

import { ReactNode, Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

// Temporarily disabled PerformanceMonitor due to conflicts with Sentry instrumentation
// TODO: Re-enable after investigating webpack/Sentry conflict
// const PerformanceMonitor = dynamic(
//   () => import('@/components/PerformanceMonitor').catch(() => ({ default: () => null })),
//   {
//     ssr: false,
//     loading: () => null
//   }
// );

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  // NOTE: ClerkProvider must always be present anywhere we use <SignedIn>/<SignedOut>/hooks.
  // We wrap children in Suspense to handle Clerk's internal Suspense boundaries and avoid hydration mismatches.

  return (
    <>
      {/* Temporarily disabled PerformanceMonitor due to Sentry conflict */}
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          elements: { rootBox: "font-sans" }
        }}
        // Use the new redirect props; this acts as a fallback when no redirect_url is present
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </ClerkProvider>
    </>
  );
}
