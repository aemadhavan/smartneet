"use client";

import dynamic from 'next/dynamic';

// Client-only wrapper to defer loading of the heavy carousel bundle
const DeferredCarousel = dynamic(
  () => import('./HeroClientCarousel').then(m => m.HeroClientCarousel),
  {
    ssr: false,
    loading: () => <div className="lg:w-1/2 h-[400px]" aria-hidden="true" />,
  }
);

export default function HeroCarouselDeferred() {
  return <DeferredCarousel />;
}
