import { ReactNode } from 'react';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientProviders from '@/components/ClientProviders';
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
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'optional', // Changed from 'swap' to 'optional' for better CLS
  preload: false,
  fallback: ['Courier New', 'monospace'],
  adjustFontFallback: true,
});

/**
 * Enhanced metadata for the application with SEO optimizations.
 * Includes expanded description, keywords, Open Graph, and Twitter Card tags.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://smarterneet.com'),
  title: 'SmarterNEET - Advanced NEET Exam Preparation Platform',
  description: 'Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics. Our comprehensive platform helps medical students achieve better results with targeted learning and performance tracking.',
  keywords: 'NEET preparation, medical entrance exam, NEET practice tests, NEET question bank, AI learning, personalized analytics, medical education, NEET study materials, exam preparation',
  
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
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags to enhance SEO that aren't handled by Next.js metadata API */}
        {/* Note: viewport is automatically set by Next.js, no need to duplicate */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="SmarterNEET Team" />
        <link rel="canonical" href="https://smarterneet.com/" />

        {/* Critical font preloading for LCP optimization */}
        <link
          rel="preload"
          href="/_next/static/media/geist-sans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Resource hints for performance optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />

        {/* DNS prefetch for Clerk (lighter than preconnect) - connection established on demand */}
        <link rel="dns-prefetch" href="https://accounts.clerk.com" />
        <link rel="dns-prefetch" href="https://clerk.accounts.dev" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-gray-50 to-white`}>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WVBD7SRF" height="0" width="0" style={{display:'none', visibility:'hidden'}}></iframe></noscript>
        <Analytics />
        <ClientProviders>
          <Header />
          <main>{children}</main>
          <Footer />
          <SpeedInsights />
        </ClientProviders>
      </body>
    </html>
  );
}
