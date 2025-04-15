//File: src/app/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUser } from '@clerk/nextjs';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { QuestionPreviewSection } from '@/components/home/QuestionPreviewSection';
import { InteractiveDemoSection } from '@/components/home/InteractiveDemoSection';
import { CTASection } from '@/components/home/CTASection';

/**
 * Main content of the homepage that uses Clerk authentication
 */
const HomePageContent = () => {
  const [overlayState, setOverlayState] = useState({
    isVisible: false,
    title: '',
    message: '',
    buttonText: '',
    buttonLink: '',
    buttonAction: () => {},
    isSignupPrompt: false
  });
  
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Determine which overlay to show based on user status
  useEffect(() => {
    if (!isLoaded) return;

    // Set a short delay to ensure everything is loaded properly
    const timer = setTimeout(() => {
      const justSignedUp = sessionStorage.getItem('just_signed_up') === 'true';
      
      if (isSignedIn) {
        // User is signed in
        if (justSignedUp) {
          // New user who just signed up
          console.log('Detected successful signup! Showing thank you message...');
          
          // Clear the flag so it doesn't show again
          sessionStorage.removeItem('just_signed_up');
          
          // Store that we've welcomed this user
          if (user) {
            localStorage.setItem(`welcomed-${user.id}`, 'true');
          }
          
          // Show thank you overlay for new user
          setOverlayState({
            isVisible: true,
            title: "Thank you for joining the SmarterNEET community!",
            message: "We're thrilled to have you on board! Get ready for an exciting journey as we prepare to launch our advanced features designed to help you ace your NEET exam.",
            buttonText: "",
            buttonLink: "",
            buttonAction: () => setOverlayState(prev => ({ ...prev, isVisible: false })),
            isSignupPrompt: false
          });
        } else {
          // Existing user who signed in
          console.log('Existing user signed in. Showing welcome back message...');
          
          // Show welcome back overlay for existing user
          setOverlayState({
            isVisible: true,
            title: "Welcome back to SmarterNEET!",
            message: "Thank you for being part of the SmarterNEET community! We're continuously working to enhance your preparation experience. Stay tuned for exciting new features coming soon!",
            buttonText: "",
            buttonLink: "",
            buttonAction: () => setOverlayState(prev => ({ ...prev, isVisible: false })),
            isSignupPrompt: false
          });
        }
      } else {
        // User is not signed in - show signup prompt
        setOverlayState({
          isVisible: true,
          title: "Exciting things are coming - join the waitlist and stay ahead.",
          message: "Be among the first to access our advanced NEET preparation platform with AI-powered practice tests and personalized analytics.",
          buttonText: "Sign up now!",
          buttonLink: "/sign-up",
          buttonAction: () => {
            sessionStorage.setItem('signup_initiated', 'true');
          },
          isSignupPrompt: true
        });
      }
    }, 1000); // Short delay to ensure everything is loaded
    
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, user]);

  // The timer useEffect for auto-hiding overlay has been removed

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-poppins relative overflow-x-hidden">
      <Head>
        <title>SmarterNEET - Advanced NEET Exam Preparation Platform</title>
        <meta name="description" content="Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Unified Overlay that always shows with content based on user status */}
      <AnimatePresence>
        {overlayState.isVisible && (
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
              {/* Overlay Message */}
              <motion.div
                initial={!overlayState.isSignupPrompt ? { scale: 0 } : {}}
                animate={!overlayState.isSignupPrompt ? { 
                  scale: [0, 1.2, 1],
                  transition: { duration: 0.5 }
                } : {}}
                className="text-5xl mb-4 mx-auto"
              >
                {!overlayState.isSignupPrompt && "🎉"}
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                {overlayState.title}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {overlayState.message}
              </p>
              
              {/* Conditional button - only show for signup prompt */}
              {overlayState.isSignupPrompt && (
                <Link
                  href="/sign-up"
                  onClick={() => {
                    sessionStorage.setItem('signup_initiated', 'true');
                  }}
                  className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
                >
                  Sign up now!
                </Link>
              )}
              
              {/* No button needed for thank you message */}
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
 * It displays the hero section, features sections, and other content.
 * Now includes overlay for all users with different messages based on status.
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
