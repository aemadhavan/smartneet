// File: src/app/page.tsx
// This is a server component (no "use client" directive)

import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Import hero section normally since it's critical for LCP
import RedesignedHeroSection from '@/components/home/RedesignedHeroSection';

// Fix dynamic imports to work with named exports
const FeaturesSection = dynamic(
  () => import('@/components/home/FeaturesSection').then(mod => mod.default), 
  {
    loading: () => <SectionSkeleton />,
    ssr: true
  }
);

// For client components, we shouldn't use ssr: false in a server component
const QuestionPreviewSection = dynamic(
  () => import('@/components/home/QuestionPreviewSection').then(mod => mod.QuestionPreviewSection),
  {
    loading: () => <SectionSkeleton />
    // Removed ssr: false
  }
);

const InteractiveDemoSection = dynamic(
  () => import('@/components/home/InteractiveDemoSection').then(mod => mod.InteractiveDemoSection),
  {
    loading: () => <SectionSkeleton />
    // Removed ssr: false
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
  description: 'Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics. Our comprehensive platform helps medical students achieve better results with targeted learning and performance tracking.',
  keywords: 'NEET preparation, medical entrance exam, NEET practice tests, NEET question bank, AI learning, personalized analytics, medical education, NEET study materials, exam preparation',
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

// Simple skeleton loader
function SectionSkeleton() {
  return (
    <div className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-1/3 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Performance optimization notes:
// 1. This is a Server Component (no "use client" directive)
// 2. Only the hero section is loaded initially (critical for LCP)
// 3. Other sections are loaded dynamically with Suspense boundaries
// 4. Proper metadata is configured for SEO

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 font-poppins relative overflow-x-hidden">
      {/* Render hero immediately for best LCP */}
      <RedesignedHeroSection />
      
      {/* Use Suspense for other sections to improve FCP and LCP */}
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
  );
}