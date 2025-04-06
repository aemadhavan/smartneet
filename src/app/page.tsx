"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
//import Image from 'next/image';
import Link from 'next/link';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { QuestionPreviewSection } from '@/components/home/QuestionPreviewSection';
import { InteractiveDemoSection } from '@/components/home/InteractiveDemoSection';
import { CTASection } from '@/components/home/CTASection';

// Animation variants

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const heroImageAnimate = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    transition: { 
      type: "spring",
      stiffness: 50,
      delay: 0.2 
    } 
  }
};

const numberCounter = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 1
    }
  }
};

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