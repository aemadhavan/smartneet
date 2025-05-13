// File: src/app/page.tsx
// This is a server component (no "use client" directive)

import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Use static import for critical path rendering
import RedesignedHeroSection from '@/components/home/RedesignedHeroSection';

// Optimized skeleton with reduced animations and simpler structure
function SectionSkeleton() {
  return (
    <div className="w-full py-16" aria-hidden="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-1/3 h-10 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Dynamic imports with more aggressive loading strategies
const FeaturesSection = dynamic(
  () => import('@/components/home/FeaturesSection'), 
  {
    loading: () => <SectionSkeleton />,
    ssr: true
  }
);

// Load content sections with higher loading priority
const QuestionPreviewSection = dynamic(
  () => import('@/components/home/QuestionPreviewSection').then(mod => mod.QuestionPreviewSection),
  {
    loading: () => <SectionSkeleton />,
  }
);

const InteractiveDemoSection = dynamic(
  () => import('@/components/home/InteractiveDemoSection').then(mod => mod.InteractiveDemoSection),
  {
    loading: () => <SectionSkeleton />,
  }
);

const CTASection = dynamic(
  () => import('@/components/home/CTASection').then(mod => mod.CTASection),
  {
    loading: () => <SectionSkeleton />,
    ssr: true
  }
);

// Define metadata for better SEO
export const metadata: Metadata = {
  title: 'SmarterNEET - Advanced NEET Exam Preparation Platform',
  description: 'Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics.',
  keywords: 'NEET preparation, medical entrance exam, NEET practice tests, NEET question bank',
  openGraph: {
    title: 'SmarterNEET - Advanced NEET Exam Preparation Platform',
    description: 'Master your NEET preparation with AI-powered practice tests and personalized analytics for NEET medical entrance exams.',
    url: 'https://smarterneet.com/',
    siteName: 'SmarterNEET',
    images: [
      {
        url: 'https://smarterneet.com/images/smarterneet-og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmarterNEET - Advanced NEET Exam Preparation Platform',
    description: 'Master your NEET preparation with AI-powered practice tests and personalized analytics for NEET medical entrance exams.',
    images: ['https://smarterneet.com/images/smarterneet-twitter-image.jpg'],
  },
};


// Performance optimization:
// 1. Streamlined rendering
// 2. Prioritized critical content path
// 3. Optimized suspense boundaries
// 4. Added proper priority loading for below-the-fold content

export default function HomePage() {
  return (
    <>
      {/* Preload critical assets */}
      <link 
        rel="preload" 
        href="/dashboard.webp" 
        as="image" 
        type="image/webp" 
      />
      
      <div className="min-h-screen bg-white dark:from-gray-900 dark:to-gray-800 font-poppins relative overflow-x-hidden">
        {/* Hero section - Critical path */}
        <RedesignedHeroSection />
        
        {/* Non-critical sections with optimized loading */}
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturesSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <QuestionPreviewSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <InteractiveDemoSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <CTASection />
        </Suspense>
      </div>
    </>
  );
}