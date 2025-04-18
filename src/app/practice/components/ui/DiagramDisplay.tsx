// File: src/app/practice/components/ui/DiagramDisplay.tsx
import { useState } from 'react';
import Image from 'next/image';
import { DiagramLabel } from '@/app/practice/types';

interface DiagramDisplayProps {
  imageUrl: string;
  labels?: DiagramLabel[];
  altText?: string;
}

export function DiagramDisplay({ imageUrl, labels, altText = "Question diagram" }: DiagramDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center">
      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div className="flex justify-center items-center h-48 w-full">
          <div className="w-8 h-8 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error state */}
      {imageError && (
        <div className="flex flex-col justify-center items-center h-48 w-full text-center">
          <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-700">Failed to load diagram image.</p>
        </div>
      )}
      
      {/* Image */}
      <div className={`relative w-full ${imageLoaded ? 'block' : 'hidden'}`}>
        <Image 
          src={imageUrl} 
          alt={altText}
          width={600}
          height={400}
          className="max-w-full"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
        />
      </div>
      
      {/* Labels display */}
      {imageLoaded && labels && labels.length > 0 && (
        <div className="mt-4 p-3 border rounded-md bg-white w-full">
          <h4 className="font-medium text-sm mb-2">Labels:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {labels.map((label, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{label.label_id}:</span> {label.label_text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}