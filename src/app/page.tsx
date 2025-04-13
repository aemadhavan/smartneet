"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { QuestionPreviewSection } from '@/components/home/QuestionPreviewSection';
import { InteractiveDemoSection } from '@/components/home/InteractiveDemoSection';
import { CTASection } from '@/components/home/CTASection';

/**
 * Main content of the homepage that uses searchParams
 */
const HomePageContent = () => {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const searchParams = useSearchParams();

  // Show overlay after 2 seconds if not returning from successful signup
  useEffect(() => {
    const signupSuccess = searchParams.get('signupSuccess');
    
    if (signupSuccess === 'true') {
      setShowThankYou(true);
      // Hide thank you message after 5 seconds
      const thankYouTimer = setTimeout(() => {
        setShowThankYou(false);
      }, 5000);
      return () => clearTimeout(thankYouTimer);
    } else {
      const timer = setTimeout(() => {
        setIsOverlayVisible(true);
      }, 2000);
      return () => clearTimeout(timer); // Cleanup on unmount
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-poppins relative overflow-x-hidden">
      <Head>
        <title>SmarterNEET - Advanced NEET Exam Preparation Platform</title>
        <meta name="description" content="Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Overlay for Sign-Up Prompt - Now non-closable */}
      <AnimatePresence>
        {isOverlayVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(75,0,130,0.8)]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center border-2 border-gradient-to-r from-blue-600 to-green-500"
            >
              {/* No Close Button - Overlay is not closable */}
              
              {/* Overlay Message */}
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Exciting things are coming - join the waitlist and stay ahead.
              </h2>
              <Link
                href="/sign-up"
                className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
              >
                Sign up now!
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashy Thank You Message after successful signup */}
      <AnimatePresence>
        {showThankYou && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-purple-600 via-blue-500 to-green-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="flex flex-col items-center justify-center text-white p-8 rounded-xl backdrop-blur-lg bg-white bg-opacity-20 shadow-2xl"
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  y: 0, 
                  opacity: 1,
                  transition: { 
                    type: "spring", 
                    damping: 12,
                    delay: 0.2 
                  } 
                }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                    transition: { 
                      times: [0, 0.6, 0.8, 1],
                      duration: 0.8
                    }
                  }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                
                <motion.h1 
                  className="text-4xl font-bold mb-2 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.4 } 
                  }}
                >
                  Thank You for Signing Up!
                </motion.h1>
                
                <motion.p 
                  className="text-xl mb-6 text-center max-w-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.6 } 
                  }}
                >
                  Welcome to the SmarterNEET community! We&apos;re excited to help you ace your NEET exam.
                </motion.p>
                
                <motion.div 
                  className="flex space-x-4"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    transition: { delay: 0.8 } 
                  }}
                >
                  <motion.button
                    className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowThankYou(false)}
                  >
                    Continue to Dashboard
                  </motion.button>
                </motion.div>
              </motion.div>
              
              {/* Animated background elements - using static array instead of dynamic creation to avoid client-side only code */}
              {Array(10).fill(0).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white bg-opacity-20"
                  initial={{ 
                    x: `${10 + (i * 10)}%`, 
                    y: `${5 + (i * 8)}%`,
                    opacity: 0.1 + (i * 0.03),
                    scale: 0.5 + (i * 0.05)
                  }}
                  animate={{ 
                    y: [null, `-${20 + (i * 5)}%`],
                    opacity: [null, 0],
                    transition: { 
                      duration: 3 + (i * 0.5),
                      repeat: Infinity,
                      repeatType: "loop",
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }
                  }}
                  style={{
                    width: `${20 + (i * 5)}px`,
                    height: `${20 + (i * 5)}px`,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Homepage Sections */}
      <HeroSection />
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
 * It displays the hero section, features section, question preview section, interactive demo section, and CTA section.
 * Now includes a non-closable overlay to prompt users to sign up and a flashy thank you message after successful signup.
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