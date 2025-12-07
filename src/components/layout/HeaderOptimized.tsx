'use client';
// src/components/layout/HeaderOptimized.tsx
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

/**
 * Optimized NavLink using Next.js Link instead of custom router logic
 * This reduces re-renders and client-side JavaScript
 */
const NavLink = memo(({
  href,
  children,
  className = ""
}: {
  href: string;
  children: React.ReactNode;
  className?: string
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`${className} ${isActive ? 'text-indigo-600 font-semibold' : ''} transition-colors hover:text-indigo-600`}
      prefetch={true}
    >
      {children}
    </Link>
  );
});

NavLink.displayName = 'NavLink';

/**
 * Memoized UserSection to prevent re-renders when navigation changes
 */
const UserSection = memo(({ isPerformanceRoute }: { isPerformanceRoute: boolean }) => {
  // On performance routes, Clerk is not loaded, so show simple sign-in links
  if (isPerformanceRoute) {
    return (
      <div className="flex items-center space-x-4">
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
      </div>
    );
  }

  // On other routes, Clerk is loaded, so use Clerk components
  return (
    <div className="flex items-center space-x-4">
      <SignedIn>
        <div className="flex items-center space-x-2">
          <UserButton
            afterSignOutUrl={process.env.NEXT_PUBLIC_APP_URL || "https://smarterneet.com"}
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8",
                userButtonTrigger: "focus:shadow-none"
              }
            }}
            showName={false}
            signInUrl="/sign-in"
          />
        </div>
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
  );
});

UserSection.displayName = 'UserSection';

/**
 * Optimized Header component with better performance characteristics
 * - Removed custom NavLink with useState (reduces re-renders)
 * - Memoized UserSection to prevent unnecessary re-renders
 * - Uses native Next.js Link with prefetch for better navigation
 */
const Header = () => {
  const pathname = usePathname();

  // Define performance routes (must match ClientProviders.tsx logic)
  const isPerformanceRoute =
    pathname?.startsWith('/smarter-guides') ||
    pathname === '/' ||
    pathname?.startsWith('/biology') ||
    pathname?.startsWith('/chemistry') ||
    pathname?.startsWith('/physics');

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and brand name */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/smarterneet-logo.jpeg"
            alt="SmarterNEET Logo"
            width={48}
            height={48}
            className="rounded-full object-contain"
            priority
            quality={60}
            sizes="48px"
          />
          <span className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SmarterNEET
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink href="/" className="text-gray-700">
            Home
          </NavLink>
          <NavLink href="/pricing" className="text-gray-700">
            Pricing
          </NavLink>
          <NavLink href="/biology" className="text-gray-700">
            Biology
          </NavLink>
          <NavLink href="/chemistry" className="text-gray-700">
            Chemistry
          </NavLink>
          <NavLink href="/physics" className="text-gray-700">
            Physics
          </NavLink>
          <NavLink href="/smarter-guides" className="text-gray-700">
            Smarter Guides (Bodhi AI)
          </NavLink>
        </nav>

        {/* Authenticated navigation links - only show when Clerk is loaded */}
        {!isPerformanceRoute && (
          <nav className="hidden md:flex items-center space-x-6">
            <SignedIn>
              <NavLink href="/dashboard" className="text-gray-700">
                Dashboard
              </NavLink>
              <NavLink href="/practice" className="text-gray-700">
                Practice
              </NavLink>
            </SignedIn>
          </nav>
        )}

        {/* Authentication - Pass isPerformanceRoute to UserSection */}
        <UserSection isPerformanceRoute={isPerformanceRoute} />
      </div>
    </header>
  );
};

export default memo(Header);
