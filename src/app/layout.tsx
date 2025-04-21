import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';

/**
 * This is the root layout for the application.
 * It defines the basic structure of the page, including the header, footer, and main content.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Enhanced metadata for the application with SEO optimizations.
 * Includes expanded description, keywords, Open Graph, and Twitter Card tags.
 */
export const metadata = {
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="SmarterNEET Team" />
        <link rel="canonical" href="https://smarterneet.com/" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-gray-50 to-white`}>
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <Header />
          <main>{children}</main>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
