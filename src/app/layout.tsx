import { ReactNode } from 'react';
import { Metadata } from 'next';
import Header from '@/components/layout/HeaderOptimized';
import dynamic from 'next/dynamic';
import ClientProviders from '@/components/ClientProviders';
import { auth } from '@clerk/nextjs/server';

const Footer = dynamic(() => import('@/components/layout/Footer'));
import GoogleTagManager from '@/components/layout/GoogleTagManager';
import './globals.css';
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/next";

/**
 * This is the root layout for the application.
 * It defines the basic structure of the page, including the header, footer, and main content.
 */

// Use 'optional' instead of 'swap' to prevent layout shift during font loading
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'optional', // Changed from 'swap' to 'optional' for better CLS
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'optional', // Changed from 'swap' to 'optional' for better CLS
  preload: false,
  fallback: ['Courier New', 'monospace'],
  adjustFontFallback: false,
});

/**
 * Enhanced metadata for the application with SEO optimizations.
 * Includes expanded description, keywords, Open Graph, and Twitter Card tags.
 * Resource hints moved here for proper App Router handling.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://smarterneet.com'),
  title: 'SmarterNEET - Advanced NEET Exam Preparation Platform',
  description: 'Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics. Our comprehensive platform helps medical students achieve better results with targeted learning and performance tracking.',
  keywords: 'NEET preparation, medical entrance exam, NEET practice tests, NEET question bank, AI learning, personalized analytics, medical education, NEET study materials, exam preparation',
  authors: [{ name: 'SmarterNEET Team' }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://smarterneet.com/',
  },

  // Open Graph tags for better social media sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://smarterneet.com/',
    siteName: 'SmarterNEET',
    title: 'SmarterNEET - Advanced NEET Exam Preparation Platform',
    description: 'Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics. Our comprehensive platform helps medical students achieve better results with targeted learning and performance tracking.',
    images: [
      {
        url: '/images/smarterneet-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SmarterNEET - NEET Exam Preparation Platform'
      }
    ]
  },

  // Twitter Card tags for Twitter sharing
  twitter: {
    card: 'summary_large_image',
    title: 'SmarterNEET - Advanced NEET Exam Preparation Platform',
    description: 'Master your NEET preparation with AI-powered practice tests and personalized analytics for NEET medical entrance exams.',
    images: ['/images/smarterneet-twitter-image.jpg'],
    creator: '@smarterneet'
  }
};

/**
 * This is the main function that renders the root layout.
 * It takes the children as a prop and renders them within the layout.
 * Uses server-side auth check to pass authentication state to Header component.
 */
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Perform server-side auth check
  // This is safe even on performance routes as it runs on the server (no client bundle impact)
  // During build time (static generation), auth() may not be available, so we default to false
  let isSignedIn = false;
  try {
    const { userId } = await auth();
    isSignedIn = !!userId;
  } catch {
    // During static generation/build time, auth() is not available
    // Default to not signed in - the actual auth state will be determined at runtime
    isSignedIn = false;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect only to critical origins actually in use */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-linear-to-b from-gray-50 to-white flex flex-col`} suppressHydrationWarning>
        {process.env.NEXT_PUBLIC_DISABLE_ANALYTICS !== '1' && <GoogleTagManager />}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WVBD7SRF" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <ClientProviders serverAuthState={isSignedIn}>
          <Header serverAuthState={isSignedIn} />
          <main className="flex-1">{children}</main>
          <Footer />
          {process.env.NODE_ENV === 'production' && <SpeedInsights />}
        </ClientProviders>
      </body>
    </html>
  );
}
