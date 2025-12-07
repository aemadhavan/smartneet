'use client';

/**
 * Client-side providers wrapper
 * OPTIMIZED: Enhanced loading strategy to reduce main-thread work
 * - PerformanceMonitor: Loaded dynamically with no SSR
 * - ClerkProvider: Imported directly and wrapped in Suspense to handle internal boundaries
 * - BfcacheHandler: Handles back/forward cache restoration
 */

import { ReactNode, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import BfcacheHandler from '@/components/BfcacheHandler';

const ClerkProvider = dynamic(() => import('@clerk/nextjs').then(mod => mod.ClerkProvider), {
  ssr: true,
});

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
  const pathname = usePathname();

  // Define routes that should NOT load Clerk for performance
  // These are typically public landing pages where TBT is critical
  const isPerformanceRoute =
    pathname?.startsWith('/smarter-guides') ||
    pathname === '/' ||
    pathname?.startsWith('/biology') ||
    pathname?.startsWith('/chemistry') ||
    pathname?.startsWith('/physics');

  // If we are on a performance-critical public route, skip ClerkProvider
  // This significantly reduces TBT by avoiding the heavy Clerk JS bundle
  if (isPerformanceRoute) {
    return (
      <>
        <BfcacheHandler />
        {children}
      </>
    );
  }

  return (
    <>
      {/* Temporarily disabled PerformanceMonitor due to Sentry conflict */}
      <BfcacheHandler />
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
