"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

// Import HeroCarousel with dynamic import to ensure client-side rendering
const HeroCarousel = dynamic(() => import("./HeroCarousel"), {
  ssr: false, // Disable SSR for this component
  loading: () => (
    <div className="w-full h-64 bg-white/10 rounded-lg animate-pulse"></div>
  ),
});

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

// Seeded random number generator function
// This ensures the same sequence of random numbers on both server and client
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Function to format percentage with fixed precision
const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(4)}%`;
};
// DNA Helix Background Component
const DNAHelixBackground = () => {
  // Generate deterministic positions using the seeded random function
  const nucleotides = Array.from({length: 20}).map((_, i) => ({
    left: formatPercentage(seededRandom(i)),
    top: formatPercentage(seededRandom(i + 100)),
    opacity: 0.3,
    animationDelay: `${(seededRandom(i + 200) * 5).toFixed(4)}s`,
    animationDuration: `${(3 + seededRandom(i + 300) * 5).toFixed(4)}s`
  }));

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {/* Abstract DNA strands */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        
        {/* DNA Helix Curves */}
        <path 
          d="M0,20 Q25,40 50,20 Q75,0 100,20 T150,20" 
          fill="none" 
          stroke="url(#dnaGradient)" 
          strokeWidth="0.5"
        />
        <path 
          d="M0,40 Q25,60 50,40 Q75,20 100,40 T150,40" 
          fill="none" 
          stroke="url(#dnaGradient)" 
          strokeWidth="0.5"
        />
        <path 
          d="M0,60 Q25,80 50,60 Q75,40 100,60 T150,60" 
          fill="none" 
          stroke="url(#dnaGradient)" 
          strokeWidth="0.5"
        />
        <path 
          d="M0,80 Q25,100 50,80 Q75,60 100,80 T150,80" 
          fill="none" 
          stroke="url(#dnaGradient)" 
          strokeWidth="0.5"
        />
        
        {/* Connecting lines */}
        {Array.from({length: 8}).map((_, i) => (
          <line 
            key={`dna-connector-${i}`}
            x1={10 + i*10} 
            y1={20 + (i%2)*60} 
            x2={10 + i*10} 
            y2={80 - (i%2)*60}
            stroke="url(#dnaGradient)" 
            strokeWidth="0.3" 
            opacity="0.7"
          />
        ))}
      </svg>
      
      {/* Glowing orbs (nucleotides) with fixed positions */}
      {nucleotides.map((style, i) => (
        <div 
          key={`nucleotide-${i}`}
          className="absolute w-4 h-4 rounded-full bg-purple-400 blur-sm animate-pulse"
          style={style}
        />
      ))}
      
      {/* Colored gradient background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 right-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-12 right-12 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
    </div>
  );
};

export const RedesignedHeroSection = () => {
  // Define stats directly in the component
  const stats = [
    { number: "500+", label: "Biology Questions" },
    { number: "25+", label: "Topics Covered" },
    { number: "100%", label: "NEET Aligned" }
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
      {/* DNA-inspired animated background */}
      <DNAHelixBackground />
      
      {/* Semi-transparent overlay to improve text readability */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-12 lg:space-y-0 lg:space-x-8">
          <motion.div 
            className="lg:w-1/2 z-10"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <motion.div
              className="inline-block mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm"
              variants={fadeIn}
            >
              <span className="mr-2 text-emerald-400">🧬</span>
              <span className="font-medium">Biology Module is now live!</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-200"
              variants={fadeIn}
            >
               Master NEET Biology with <span className="text-emerald-400">SmarterNEET</span>
            </motion.h1>
            
            {/* Removed motion wrapper and variants from this paragraph to improve LCP */}
            <p 
              className="text-lg md:text-xl text-indigo-100 mb-8 max-w-xl"
            >
              Our comprehensive biology module is now live! Get access to expert-crafted questions, AI-driven insights, and a personalized learning journey focused on NEET biology topics.
            </p>
            
            <motion.div 
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8"
              variants={fadeIn}
            >
              <Link 
                href="/sign-up" 
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1 text-center backdrop-blur-sm"
              >
                Sign up for Biology
              </Link>
              <Link 
                href="/biology" 
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all text-center"
              >
                View Biology Topics
              </Link>
            </motion.div>
            
            {/* Biology Launch Features */}
            <motion.div 
              className="space-y-4"
              variants={staggerContainer}
            >
              {[
                { icon: "🧪", text: "500+ AI and Expert-Crafted Biology Questions" },
                { icon: "📊", text: "Topic-wise Performance Analytics" },
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={fadeIn}
                  className="flex items-center space-x-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <span>{feature.icon}</span>
                  </div>
                  <span className="text-sm md:text-base text-indigo-100">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Stats counter - Modified to highlight biology focus */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12" 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
                  variants={fadeIn}
                >
                  <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">{stat.number}</p>
                  <p className="text-indigo-200 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Hero Image - Biology focused dashboard */}
          <motion.div 
            className="lg:w-1/2 flex justify-center"
            variants={heroImageAnimate}
            initial="hidden"
            animate="visible"
          >
            <HeroCarousel />
          </motion.div>
        </div>
      </div>

      {/* Wave SVG divider - Modified for better integration */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 200">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,90.7C672,75,768,85,864,101.3C960,117,1056,139,1152,138.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default RedesignedHeroSection;