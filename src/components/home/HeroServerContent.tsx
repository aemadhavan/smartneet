// Server Component - Critical LCP content rendered immediately
// No client-side JavaScript required for initial render

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

// Simple stats with reduced processing
const stats = [
  { number: "4200+", label: "Science Questions" },
  { number: "50+", label: "Topics Covered" },
  { number: "100%", label: "NEET Aligned" }
];

export async function HeroServerContent() {
  // Server-side auth check (no client bundle needed)
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  return (
    <div className="lg:w-1/2 z-10">
      <div className="inline-block mb-4 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-sm">
        <span className="mr-2 text-emerald-400">🧬</span>
        <span className="font-medium">Biology & Chemistry Modules are now live!</span>
      </div>

      {/* Critical LCP Element - Rendered immediately on server */}
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

      {/* Feature list - Server rendered, no JS needed */}
      <div className="space-y-4">
        {[
          { icon: "🧪", text: "4200+ AI and Expert-Crafted Science Questions" },
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

      {/* Stats counter - Server rendered, no motion animations */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="text-center p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <p className="text-2xl md:text-3xl font-bold text-white">{stat.number}</p>
            <p className="text-indigo-200 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
