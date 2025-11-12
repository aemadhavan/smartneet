'use client';

/**
 * Client-side providers wrapper
 * OPTIMIZED: Enhanced loading strategy to reduce main-thread work
 * - PerformanceMonitor: Loaded dynamically with no SSR
 * - ClerkProvider: Configured with appearance prop for faster hydration
 * - Clerk loads only necessary components via dynamic imports
 */

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

// Dynamically import PerformanceMonitor (client-only, no SSR needed)
const PerformanceMonitor = dynamic(
  () => import('@/components/PerformanceMonitor'),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      <PerformanceMonitor />
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          // Minimize initial bundle size by using system fonts
          elements: {
            rootBox: "font-sans"
          },
          layout: {
            // Reduce layout complexity for faster rendering
            shimmer: false
          }
        }}
        // Load Clerk components only when needed
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
      >
        {children}
      </ClerkProvider>
    </>
  );
}
