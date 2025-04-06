import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'SmarterNEET - Advanced NEET Exam Preparation Platform',
  description: 'Master your NEET preparation with 10 years of previous questions, AI-powered practice tests, and personalized analytics',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-gray-50 to-white`}>
      <ClerkProvider>
        <Header />        
        <main>{children}</main>
        <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}