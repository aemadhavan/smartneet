// Optimized Hero Section - Server Component
// Critical LCP content rendered on server, carousel loaded on client
// This eliminates the 890ms render delay by avoiding client-side hydration for the h1

import { HeroServerContent } from "./HeroServerContent";
import { HeroClientCarousel } from "./HeroClientCarousel";

// Optimized DNA Helix Background - Pure CSS, no client JS
const DNAHelixBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0 opacity-30">
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

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

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full"></div>
      <div className="absolute bottom-12 right-12 w-80 h-80 bg-emerald-500/10 rounded-full"></div>
    </div>
  );
};

export async function OptimizedHeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
      {/* Background - Pure CSS, no JS */}
      <DNAHelixBackground />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/10 z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-12 lg:space-y-0 lg:space-x-8">
          {/* Server-rendered critical content (includes LCP h1) */}
          <HeroServerContent />

          {/* Client-rendered carousel (won't block LCP) */}
          <HeroClientCarousel />
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
}

export default OptimizedHeroSection;
