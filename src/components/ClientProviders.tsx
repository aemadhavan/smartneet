'use client';

/**
 * Client-side providers wrapper
 * OPTIMIZED: Enhanced loading strategy to reduce main-thread work
 * - PerformanceMonitor: Loaded dynamically with no SSR
 * - ClerkProvider: Loaded only on routes that need auth UI (dashboard, practice, auth pages)
 */

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import PerformanceMonitor (client-only, no SSR needed)
const PerformanceMonitor = dynamic(
  () => import('@/components/PerformanceMonitor'),
  { ssr: false }
);

// Defer ClerkProvider to the client to avoid pulling polyfills into the critical vendor chunk
const ClerkProvider = dynamic(
  () => import('@clerk/nextjs').then(m => m.ClerkProvider),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const isDev = process.env.NODE_ENV !== 'production';

  // NOTE: ClerkProvider must always be present anywhere we use <SignedIn>/<SignedOut>/hooks.
  // We still load it via a dynamic import with ssr: false so it doesn't impact the server bundle.

  return (
    <>
      {isDev && <PerformanceMonitor />}
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          elements: { rootBox: "font-sans" },
          layout: { shimmer: false }
        }}
        // Use the new redirect props; this acts as a fallback when no redirect_url is present
        fallbackRedirectUrl="/dashboard"
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
      >
        {children}
      </ClerkProvider>
    </>
  );
}
