//File: src/app/sign-up/[[...sign-up]]/page.tsx
"use client";

import { SignUp } from '@clerk/nextjs';
import { useEffect } from 'react';
import Script from 'next/script';

export default function SignupPage() {
  // Set a flag when the signup page loads
  useEffect(() => {
    sessionStorage.setItem('signup_initiated', 'true');
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <SignUp 
          redirectUrl="/"
          afterSignUpUrl="/"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-orange-500 hover:bg-orange-600 text-white',
            }
          }}
        />
      </div>
      
      {/* Add the Clerk event listener script directly inside the component */}
      <Script id="clerk-signup-listener">
        {`
          if (window.Clerk) {
            window.Clerk.addListener(({ user }) => {
              if (user) {
                sessionStorage.setItem('just_signed_up', 'true');
              }
            });
          } else {
            window.addEventListener('load', function() {
              if (window.Clerk) {
                window.Clerk.addListener(({ user }) => {
                  if (user) {
                    sessionStorage.setItem('just_signed_up', 'true');
                  }
                });
              }
            });
          }
        `}
      </Script>
    </div>
  );
}