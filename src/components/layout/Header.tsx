'use client';
// src/components/layout/Header.tsx
import Link from 'next/link';
import Image from 'next/image';
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import GoogleTagManager from './GoogleTagManager';

/**
 * Custom NavLink component with loading state
 */
const NavLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If already on the same page, don't show loading
    if (pathname === href) {
      return;
    }
    
    setIsLoading(true);
    router.push(href);
  };

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-50 cursor-wait' : ''} transition-all duration-200`}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Header component for the application.
 * Contains navigation links and authentication controls.
 * Now includes the GoogleTagManager component for analytics.
 */
const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200">
      {/* Include Google Tag Manager */}
      <GoogleTagManager />
      
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and brand name */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/smarterneet-logo.jpeg"
            alt="SmarterNEET Logo"
            width={64}
            height={64}
            className="rounded-full object-contain"
            priority
            unoptimized
            loading="eager"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SmarterNEET
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink href="/" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Home
          </NavLink>
          <NavLink href="/pricing" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Pricing
          </NavLink>
          <NavLink href="/biology" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Biology
          </NavLink>         
          <NavLink href="/smarter-guides" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Smarter Guides (Bodhi AI)
          </NavLink>
          <SignedIn>
            <NavLink href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Dashboard
            </NavLink>
            <NavLink href="/practice" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Practice
            </NavLink>
          </SignedIn>
          <span className="text-gray-400">Physics (Coming soon)</span>
          <span className="text-gray-400">Chemistry (Coming soon)</span>
          
        </nav>

        {/* Authentication */}
        <div className="flex items-center space-x-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link 
              href="/sign-in"
              className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;