"use client";

import { useState, useEffect, useRef } from 'react';

interface LazyChartProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}

export default function LazyChart({ 
  children, 
  fallback = <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse"><div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div></div>,
  rootMargin = "100px"
}: LazyChartProps) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {isInView ? children : fallback}
    </div>
  );
}