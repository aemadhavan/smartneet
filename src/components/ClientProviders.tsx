'use client';

/**
 * Client-side providers wrapper
 * OPTIMIZED: Enhanced loading strategy to reduce main-thread work
 * - PerformanceMonitor: Loaded dynamically with no SSR
 * - ClerkProvider: Loaded only on routes that need auth UI (dashboard, practice, auth pages)
 */

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  // Routes that actually need Clerk on first paint
  const needsClerk = pathname?.startsWith('/dashboard')
    || pathname?.startsWith('/practice')
    || pathname?.startsWith('/admin')
    || pathname?.startsWith('/sign-in')
    || pathname?.startsWith('/sign-up');

  return (
    <>
      {isDev && <PerformanceMonitor />}
      {needsClerk ? (
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          appearance={{
            elements: { rootBox: "font-sans" },
            layout: { shimmer: false }
          }}
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          {children}
        </ClerkProvider>
      ) : (
        <>{children}</>
      )}
    </>
  );
}
