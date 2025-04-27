//File: src/wip/app/page.tsx
"use client";

import React, { Suspense } from 'react';
import Head from 'next/head';

//import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { QuestionPreviewSection } from '@/components/home/QuestionPreviewSection';
import { InteractiveDemoSection } from '@/components/home/InteractiveDemoSection';
import { CTASection } from '@/components/home/CTASection';
//import LaunchCounter from '@/components/home/LaunchCounter'; // Import the new component
import RedesignedHeroSection from '@/components/home/RedesignedHeroSection';

/**
 * Main content of the homepage
 */
const HomePageContent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-poppins relative overflow-x-hidden">
      <Head>
        <title>SmarterNEET - Advanced NEET Exam Preparation Platform</title>
        <meta name="description" content="Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics. Our comprehensive platform helps medical students achieve better results with targeted learning and performance tracking." />
        <meta name="keywords" content="NEET preparation, medical entrance exam, NEET practice tests, NEET question bank, AI learning, personalized analytics, medical education, NEET study materials, exam preparation" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://smarterneet.com/" />
        
        {/* Open Graph Tags for better social sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://smarterneet.com/" />
        <meta property="og:title" content="SmarterNEET - Advanced NEET Exam Preparation Platform" />
        <meta property="og:description" content="Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics. Our comprehensive platform helps medical students achieve better results with targeted learning and performance tracking." />
        <meta property="og:image" content="https://smarterneet.com/images/smarterneet-og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="SmarterNEET" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@smarterneet" />
        <meta name="twitter:creator" content="@smarterneet" />
        <meta name="twitter:title" content="SmarterNEET - Advanced NEET Exam Preparation Platform" />
        <meta name="twitter:description" content="Master your NEET preparation with AI-powered practice tests and personalized analytics for NEET medical entrance exams." />
        <meta name="twitter:image" content="https://smarterneet.com/images/smarterneet-twitter-image.jpg" />
        
        {/* Additional meta tags for improved SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="author" content="SmarterNEET Team" />
      </Head>

      {/* Launch Counter */}
      {/* <LaunchCounter /> */}

      {/* Existing Homepage Sections */}
      <RedesignedHeroSection/>
      {/* Features Section */}
      <FeaturesSection />

      {/* Question Preview Section */}
      <QuestionPreviewSection />

      {/* Interactive Demo Section */}
      <InteractiveDemoSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
};

/**
 * This is the home page of the application.
 * It displays the hero section, features sections, and other content.
 */
const HomePage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl text-gray-600">Loading...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
};

export default HomePage;