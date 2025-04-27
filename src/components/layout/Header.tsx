// src/components/layout/Header.tsx
import Link from 'next/link';
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import GoogleTagManager from './GoogleTagManager';

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
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SmarterNEET
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <Link href="/pricing" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Pricing
          </Link>
          <Link href="/biology" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Biology
          </Link>         
          
          <SignedIn>
            <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/practice" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Practice
            </Link>
          </SignedIn>
          <li className="text-gray-400">Physics (Coming soon)</li>
          <li className="text-gray-400">Chemistry (Coming soon)</li>
          
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