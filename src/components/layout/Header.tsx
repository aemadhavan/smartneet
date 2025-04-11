"use client"

import React from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

/**
 * This is the header component for the application.
 * It displays the logo, navigation links, and authentication buttons.
 */
const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Smarter<span className="text-emerald-500">NEET</span></span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/" className="border-transparent text-gray-700 hover:text-indigo-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 hover:border-indigo-600 transition-all">
                Home
              </Link>
              <Link href="#" className="border-transparent text-gray-700 hover:text-indigo-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 hover:border-indigo-600 transition-all">
                Biology
              </Link>
              <Link href="#" className="border-transparent text-gray-700 hover:text-indigo-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 hover:border-indigo-600 transition-all">
                Physics
              </Link>
              <Link href="#" className="border-transparent text-gray-700 hover:text-indigo-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 hover:border-indigo-600 transition-all">
                Chemistry
              </Link>
              <Link href="#" className="border-transparent text-gray-700 hover:text-indigo-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 hover:border-indigo-600 transition-all">
                Previous Papers
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
              <SignedOut>
                <Link 
                  href="/sign-in" 
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/sign-up" 
                  className="rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 focus:outline-none">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
