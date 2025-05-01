"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

const HeroCarousel = () => {
  // Import Autoplay only when component mounts
  const [autoplayPlugin, setAutoplayPlugin] = useState<EmblaPluginType | null>(null);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    import("embla-carousel-autoplay").then((Autoplay) => {
      setAutoplayPlugin(Autoplay.default({ delay: 5000, stopOnInteraction: true }));
    });
  }, []);

  // Set up the slide change effect
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    // Initialize correct index
    setCurrentIndex(api.selectedScrollSnap());

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Array of images for the carousel - Optimized dimensions and formats
  const images: CarouselImage[] = [
    { src: "/dashboard.webp", alt: "Dashboard visualization showing NEET practice analytics", width: 1200, height: 800 },
    { src: "/practice-analysis.webp", alt: "Detailed practice analysis showing performance metrics", width: 1200, height: 800 },
    { src: "/practice-summary.webp", alt: "Summary of practice session results", width: 1200, height: 800 },
  ];
  
  // Hero image animation - simplified for better performance
  const heroImageAnimate = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5,
        delay: 0.2 
      } 
    }
  };

  return (
    <motion.div
      className="w-full lg:w-11/12 flex justify-center mx-auto"
      variants={heroImageAnimate}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full relative">
        {/* Simplified decorative elements with reduced blur operations */}
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
                          priority={index === 0} // Only prioritize the first image
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
        
        {/* Simplified carousel indicators - reduced DOM elements */}
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full ${currentIndex === index ? 'bg-white' : 'bg-white/30'}`}
              onClick={() => api?.scrollTo(index)}
              style={{ cursor: 'pointer' }}
            ></div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HeroCarousel;