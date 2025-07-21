"use client";

import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
// Removed invalid import since @/hooks/useAuth doesn't exist
// import { useAuth } from "@/hooks/useAuth";

// Import HeroCarousel with lazy loading
const HeroCarousel = lazy(() => import("./HeroCarousel"));

// Simple loading placeholder for the carousel
const CarouselPlaceholder = () => (
  <div className="w-full h-64 bg-indigo-800/20 rounded-lg animate-pulse"></div>
);

// Simplified animation variants for better performance
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

// Optimized DNA Helix Background Component - reduced complexity
const DNAHelixBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0 opacity-30">
      {/* Simplified DNA representation with fewer SVG elements */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        
        {/* Reduced number of paths */}
        <path 
          d="M0,20 Q25,40 50,20 Q75,0 100,20" 
          fill="none" 
          stroke="url(#dnaGradient)" 
          strokeWidth="0.5"
        />
        <path 
          d="M0,80 Q25,100 50,80 Q75,60 100,80" 
          fill="none" 
          stroke="url(#dnaGradient)" 
          strokeWidth="0.5"
        />
      </svg>
      
      {/* Reduced number of decorative elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full"></div>
      <div className="absolute bottom-12 right-12 w-80 h-80 bg-emerald-500/10 rounded-full"></div>
    </div>
  );
};
export const RedesignedHeroSection = () => {
  const { userId } = useAuth();
  const isAuthenticated = !!userId;
  // Simple stats with reduced processing
  const stats = [
    { number: "500+", label: "Science Questions" },
    { number: "50+", label: "Topics Covered" },
    { number: "100%", label: "NEET Aligned" }
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
      {/* Simplified background */}
      <DNAHelixBackground />
      
      {/* Reduced overlay complexity */}
      <div className="absolute inset-0 bg-black/10 z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-12 lg:space-y-0 lg:space-x-8">
          {/* Text content - Critical for LCP */}
          <div className="lg:w-1/2 z-10">
            <div className="inline-block mb-4 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-sm">
              <span className="mr-2 text-emerald-400">🧬</span>
              <span className="font-medium">Biology & Chemistry Modules are now live!</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
              Master NEET Biology & Chemistry with <span className="text-emerald-400">SmarterNEET</span>
            </h1>
            
            <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-xl">
              Our comprehensive biology and chemistry modules are now live! Get access to expert-crafted questions, AI-driven insights, and a personalized learning journey focused on NEET science topics.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <Link 
                href={isAuthenticated ? "/practice" : "/sign-up"}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl shadow-lg transition-all text-center"
              >
                {isAuthenticated ? "Practice Now" : "Start Learning"}
              </Link>
              <Link 
                href="/biology" 
                className="px-8 py-4 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all text-center"
              >
                View All Topics
              </Link>
            </div>
            
            {/* Subject Quick Access */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
              <Link 
                href="/biology"
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 rounded-lg hover:bg-emerald-500/30 transition-all"
              >
                <span className="text-emerald-400">🧬</span>
                <span className="text-sm font-medium">Biology Topics</span>
              </Link>
              <Link 
                href="/chemistry"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-100 rounded-lg hover:bg-blue-500/30 transition-all"
              >
                <span className="text-blue-400">⚗️</span>
                <span className="text-sm font-medium">Chemistry Topics</span>
              </Link>
            </div>
            
            {/* Feature list - Simplified rendering */}
            <div className="space-y-4">
              {[
                { icon: "🧪", text: "500+ AI and Expert-Crafted Science Questions" },
                { icon: "📊", text: "Topic-wise Performance Analytics" },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span>{feature.icon}</span>
                  </div>
                  <span className="text-sm md:text-base text-indigo-100">{feature.text}</span>
                </div>
              ))}
            </div>
            
            {/* Stats counter - Simplified with motion optimization */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12" 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { 
                    delayChildren: 0.3,
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center p-3 rounded-lg bg-white/5 border border-white/10"
                  variants={fadeIn}
                >
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.number}</p>
                  <p className="text-indigo-200 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Hero Image - With Suspense and fallback */}
          <div className="lg:w-1/2 flex justify-center">
            <Suspense fallback={<CarouselPlaceholder />}>
              <HeroCarousel />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Simplified wave SVG divider */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L1440,32L1440,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default RedesignedHeroSection;