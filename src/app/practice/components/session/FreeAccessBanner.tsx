// src/app/practice/components/session/FreeAccessBanner.tsx
import { memo } from 'react';
import Link from 'next/link';

interface FreeAccessBannerProps {
  message?: string;
  linkText?: string;
  linkHref?: string;
}

const FreeAccessBanner = memo(function FreeAccessBanner({ 
  message = "You're using a free practice session.",
  linkText = "Upgrade to premium",
  linkHref = "/pricing"
}: FreeAccessBannerProps) {
  return (
    <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
      <p className="text-blue-700">
        <span className="font-semibold">Free access:</span> {message} 
        <Link href={linkHref} className="ml-2 text-blue-600 underline">{linkText}</Link> to access all topics.
      </p>
    </div>
  );
});

export { FreeAccessBanner };