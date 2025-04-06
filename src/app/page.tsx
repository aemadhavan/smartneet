"use client"

import React from 'react';

import Head from 'next/head';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { QuestionPreviewSection } from '@/components/home/QuestionPreviewSection';
import { InteractiveDemoSection } from '@/components/home/InteractiveDemoSection';
import { CTASection } from '@/components/home/CTASection';

// Animation variants


const HomePage = () => {
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Head>
        <title>SmarterNEET - Advanced NEET Exam Preparation Platform</title>
        <meta name="description" content="Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <HeroSection/>
      {/* Features Section */}
      <FeaturesSection/>

      {/* Question Preview Section */}
      <QuestionPreviewSection/>

      {/* Interactive Demo Section */}
      <InteractiveDemoSection/>
      
      {/* Success Stories Section */}
      
      
      {/* Viral Features Section with 3D Effects */}
      
      {/* CTA Section */}
      <CTASection/>
      
      
    </div>
  );
};

export default HomePage;