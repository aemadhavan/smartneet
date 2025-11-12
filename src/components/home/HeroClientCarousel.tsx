"use client";

// Client Component - Only the interactive carousel needs client-side JS
// This won't block the LCP element from rendering

import { useState, useEffect, useTransition, useDeferredValue } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import type { EmblaPluginType } from "embla-carousel";

// Define image type for better type safety
interface CarouselImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export function HeroClientCarousel() {
  // Import Autoplay only when component mounts
  const [autoplayPlugin, setAutoplayPlugin] = useState<EmblaPluginType | null>(null);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, startTransition] = useTransition();
  const deferredIndex = useDeferredValue(currentIndex);

  useEffect(() => {
    // Defer autoplay loading further to allow critical rendering to complete
    // Use requestIdleCallback if available, otherwise setTimeout with longer delay
    const loadAutoplay = () => {
      import("embla-carousel-autoplay")
        .then((Autoplay) => {
          startTransition(() => {
            setAutoplayPlugin(Autoplay.default({ delay: 5000, stopOnInteraction: true }));
          });
        })
        .catch((error) => {
          console.error("Failed to load autoplay plugin", error);
        });
    };

    if ('requestIdleCallback' in window) {
      const idleCallbackId = (window as Window & { requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback(loadAutoplay, { timeout: 2000 });
      return () => (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleCallbackId);
    } else {
      const timer = setTimeout(loadAutoplay, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Set up the slide change effect with non-blocking updates
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      // Use startTransition to prevent carousel state updates from blocking UI
      startTransition(() => {
        setCurrentIndex(api.selectedScrollSnap());
      });
    };

    api.on("select", onSelect);
    startTransition(() => {
      setCurrentIndex(api.selectedScrollSnap());
    });

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Array of images for the carousel
  const images: CarouselImage[] = [
    { src: "/dashboard.webp", alt: "Dashboard visualization showing NEET practice analytics", width: 1200, height: 800 },
    { src: "/practice-analysis.webp", alt: "Detailed practice analysis showing performance metrics", width: 1200, height: 800 },
    { src: "/practice-summary.webp", alt: "Summary of practice session results", width: 1200, height: 800 },
  ];

  return (
    <div className="lg:w-1/2 flex justify-center">
      <div className="w-full lg:w-11/12 mx-auto">
        {/* Fixed aspect ratio container to prevent layout shift */}
        <div className="w-full relative" style={{ aspectRatio: '3/2', minHeight: '400px' }}>
          {/* Simplified decorative elements */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-600/5 rounded-full z-0"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-purple-600/5 rounded-full z-0"></div>

          <Carousel
            plugins={autoplayPlugin ? [autoplayPlugin] : []}
            className="w-full"
            opts={{
              align: "center",
              loop: true,
            }}
            setApi={setApi}
          >
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="p-4">
                    <Card className="border-0 bg-white/5 overflow-hidden shadow-lg">
                      <CardContent className="flex items-center justify-center p-0">
                        <div className="relative w-full h-full">
                          <Image
                            src={image.src}
                            width={image.width}
                            height={image.height}
                            alt={image.alt}
                            className="w-full h-auto object-contain"
                            priority={index === 0}
                            fetchPriority={index === 0 ? "high" : "low"}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                            loading={index === 0 ? "eager" : "lazy"}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 -translate-y-1/2 bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-md z-10" />
            <CarouselNext className="absolute right-4 -translate-y-1/2 bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-md z-10" />
          </Carousel>

          {/* Carousel indicators with deferred updates to prevent blocking */}
          <div className="flex justify-center mt-4 space-x-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${deferredIndex === index ? 'bg-white' : 'bg-white/30'}`}
                onClick={() => api?.scrollTo(index)}
                style={{ cursor: 'pointer' }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
