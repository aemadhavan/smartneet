'use client';

/**
 * Client-side providers wrapper
 * This component handles client-only enhancements
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
      <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
        {children}
      </ClerkProvider>
    </>
  );
}
