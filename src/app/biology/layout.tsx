// src/app/biology/layout.tsx
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Biology - SmarterNEET',
  description: 'Practice NEET Biology questions covering Botany and Zoology topics',
};

export default function BiologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-white shadow-sm py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-800 hover:text-indigo-600 font-medium">
                Home
              </Link>
              <span className="text-gray-300">/</span>
              <Link href="/biology" className="text-indigo-600 font-medium">
                Biology
              </Link>
            </div>
            <div className="hidden md:flex space-x-6">
              <Link href="/biology/bot" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md hover:bg-gray-50">
                Botany
              </Link>
              <Link href="/biology/zoo" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md hover:bg-gray-50">
                Zoology
              </Link>
              <Link href="/practice" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                Practice Now
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SmarterNEET.com - NEET Exam Preparation Platform
          </div>
        </div>
      </footer>
    </div>
  );
}