// src/components/subscription/PremiumFeatureOverlay.tsx
import React from 'react';
import { useRouter } from 'next/navigation';

interface PremiumFeatureOverlayProps {
  title?: string;
  description?: string;
  ctaText?: string;
  variant?: 'topic' | 'test' | 'analytics';
  totalCount?: number;
  accessibleCount?: number;
}

const PremiumFeatureOverlay: React.FC<PremiumFeatureOverlayProps> = ({
  title = 'Premium Feature',
  description,
  ctaText = 'Upgrade Now',
  variant = 'topic',
  totalCount,
  accessibleCount = 2
}) => {
  const router = useRouter();

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  // Generate appropriate description based on variant if none provided
  const defaultDescription = () => {
    if (description) return description;
    
    switch (variant) {
      case 'topic':
        return totalCount 
          ? `Unlock this topic and ${totalCount - accessibleCount - 1} more with Premium!`
          : 'Unlock all topics with Premium!';
      case 'test':
        return 'Take unlimited tests with Premium!';
      case 'analytics':
        return 'Access detailed analytics with Premium!';
      default:
        return 'Unlock premium features!';
    }
  };

  // Different icons based on variant
  const renderIcon = () => {
    switch (variant) {
      case 'topic':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'test':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'analytics':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-10 rounded-lg backdrop-blur-sm">
      <div className="text-center p-6">
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full p-3 inline-block mb-3 shadow-lg">
          {renderIcon()}
        </div>
        <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-200 mb-4">{defaultDescription()}</p>
        <button 
          onClick={handleUpgradeClick}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-2 rounded-md hover:from-yellow-500 hover:to-yellow-600 font-medium transition-colors shadow-md"
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
};

export default PremiumFeatureOverlay;