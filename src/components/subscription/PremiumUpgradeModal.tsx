// src/components/subscription/PremiumUpgradeModal.tsx
import React from 'react';
import { useRouter } from 'next/navigation';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'topic' | 'test' | 'analytics'; 
  subjectName?: string;
  totalTopicsCount?: number;
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  variant = 'topic',
  subjectName = '',
  totalTopicsCount = 0
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  // Title and headline based on variant
  const getTitle = () => {
    switch (variant) {
      case 'topic':
        return `Unlock All ${subjectName} Topics`;
      case 'test':
        return 'Unlimited Tests';
      case 'analytics':
        return 'Advanced Analytics';
      default:
        return 'Upgrade to Premium';
    }
  };

  const getHeadline = () => {
    switch (variant) {
      case 'topic':
        return `Unlock all ${totalTopicsCount} ${subjectName} topics and accelerate your NEET preparation!`;
      case 'test':
        return 'Take unlimited practice tests and maximize your exam readiness!';
      case 'analytics':
        return 'Get detailed performance analytics to identify your strengths and weaknesses!';
      default:
        return 'Upgrade to Premium for full access to all features!';
    }
  };

  // Benefits based on variant
  const getBenefits = () => {
    const commonBenefits = [
      'Unlimited practice sessions',
      'Detailed performance analytics',
      'Personalized study plans'
    ];
    
    switch (variant) {
      case 'topic':
        return [
          `Unlimited access to all ${totalTopicsCount} ${subjectName} topics`,
          'Practice unlimited questions across all subjects',
          ...commonBenefits
        ];
      case 'test':
        return [
          'Take unlimited tests every day',
          'Access previous year NEET questions',
          'Track your progress over time',
          ...commonBenefits
        ];
      case 'analytics':
        return [
          'Detailed performance analytics',
          'Topic-wise strength analysis',
          'Personalized study recommendations',
          'Weekly progress reports',
          'Exam readiness predictions'
        ];
      default:
        return [
          'Unlimited access to all topics',
          'Unlimited tests',
          ...commonBenefits
        ];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="text-center mb-6">
          <div className="mx-auto bg-indigo-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{getTitle()}</h3>
          <p className="text-gray-600">{getHeadline()}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Premium Benefits:</h4>
          <ul className="space-y-2">
            {getBenefits().map((benefit, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button 
            onClick={handleUpgradeClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
          >
            Upgrade Now
          </button>
          <button 
            onClick={onClose}
            className="border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Continue with Free Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgradeModal;