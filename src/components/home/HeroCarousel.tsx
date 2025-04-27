import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Autoplay from "embla-carousel-autoplay";

const HeroCarousel = () => {
  // Array of images for the carousel
  const images = [
    { src: "/dashboard.png", alt: "Dashboard" },
    { src: "/practice-analysis.png", alt: "Practice Analysis" },
    { src: "/practice-summary.png", alt: "Practice Summary" },
  ];

  // Hero image animation
  const heroImageAnimate = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        type: "spring",
        stiffness: 50,
        delay: 0.2 
      } 
    }
  };
  
  const [plugin] = useState(() => Autoplay({ delay: 3000, stopOnInteraction: true }));

  return (
    <motion.div
      className="w-full lg:w-11/12 flex justify-center mx-auto" // Expanded to nearly full width
      variants={heroImageAnimate}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full relative">
        {/* Decorative elements to match your theme */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-xl z-0"></div>
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-purple-600/10 rounded-full blur-xl z-0"></div>
        
        <Carousel 
          plugins={[plugin]}
          className="w-full"
          opts={{
            align: "center",
            loop: true,
          }}
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="p-4 md:p-6 lg:p-8"> {/* Increased padding at larger screen sizes */}
                  <Card className="border-0 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                    <CardContent className="flex items-center justify-center p-0">
                      <div className="relative w-full h-full transform transition-transform duration-500 hover:scale-105">
                        <Image 
                          src={image.src} 
                          width={1200}  // Further increased image size
                          height={800}
                          alt={image.alt}
                          className="w-full h-auto object-contain"
                          priority
                        />
                        {/* Optional subtle overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/5 to-transparent pointer-events-none"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-8 -translate-y-1/2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md shadow-lg z-10" />
          <CarouselNext className="absolute right-8 -translate-y-1/2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md shadow-lg z-10" />
        </Carousel>
        
        {/* Carousel indicators */}
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <div key={index} className="w-2 h-2 rounded-full bg-white/50"></div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HeroCarousel;