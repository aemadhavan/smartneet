// File: src/app/practice/components/ui/DiagramDisplay.tsx
import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { DiagramLabel } from '@/app/practice/types';
import { logger } from '@/lib/logger';

interface DiagramDisplayProps {
  imageUrl: string;
  labels?: DiagramLabel[];
  altText?: string;
}

const DiagramDisplay = memo(function DiagramDisplay({ 
  imageUrl, 
  labels, 
  altText = "Question diagram" 
}: DiagramDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImgStatic, setIsImgStatic] = useState(false);
  
  // Check if the image is from a static directory (public)
  useEffect(() => {
    // If URL starts with a slash and doesn't contain http or https, it's a static image
    const isStatic = Boolean(imageUrl && imageUrl.startsWith('/') && !imageUrl.includes('http'));
    setIsImgStatic(isStatic);
    
    if (isStatic) {
      logger.debug('Using static image from public directory', { 
        context: 'DiagramDisplay',
        data: {
          imageUrl
        }
      });
    }
  }, [imageUrl]);

  // Handle image loading success
  const handleImageLoaded = () => {
    setImageLoaded(true);
    setImageError(false);
    logger.debug('Diagram image loaded successfully', { 
      context: 'DiagramDisplay',
      data: {
        imageUrl
      }
    });
  };

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    logger.error('Failed to load diagram image', { 
      context: 'DiagramDisplay',
      data: {
        imageUrl
      }
    });
  };

  // Calculate priority loading
  // We set priority for static images from the public directory as they're more likely critical
  const isPriority = isImgStatic;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md flex flex-col items-center">
      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div className="flex justify-center items-center h-48 w-full" aria-label="Loading diagram">
          <div className="w-8 h-8 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error state */}
      {imageError && (
        <div 
          className="flex flex-col justify-center items-center h-48 w-full text-center"
          role="alert"
          aria-live="assertive" 
        >
          <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-700 dark:text-gray-300">Failed to load diagram image.</p>
        </div>
      )}
      
      {/* Image with responsive sizes */}
      <div className={`relative w-full ${imageLoaded ? 'block' : 'hidden'}`} aria-hidden={!imageLoaded}>
        <Image 
          src={imageUrl} 
          alt={altText}
          width={600}
          height={400}
          sizes={`(max-width: 640px) 100vw, (max-width: 768px) 80vw, 700px`}
          quality={80}
          priority={isPriority}
          loading={isPriority ? 'eager' : 'lazy'}
          className="max-w-full dark:opacity-90 dark:contrast-125 rounded-md" // Adjust contrast for dark mode visibility
          onLoad={handleImageLoaded}
          onError={handleImageError}
          style={{
            maxHeight: '600px',
            objectFit: 'contain',
          }}
          aria-describedby={labels && labels.length > 0 ? "diagram-labels" : undefined}
        />
      </div>
      
      {/* Labels display */}
      {imageLoaded && labels && labels.length > 0 && (
        <div 
          id="diagram-labels"
          className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 w-full"
        >
          <h4 
            className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200" 
            id="labels-heading"
          >
            Labels:
          </h4>
          <div 
            className="grid grid-cols-2 md:grid-cols-3 gap-2"
            role="list"
            aria-labelledby="labels-heading"
          >
            {labels.map((label, index) => (
              <div 
                key={index} 
                className="text-sm text-gray-700 dark:text-gray-300"
                role="listitem"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{label.label_id}:</span> {label.label_text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export { DiagramDisplay };