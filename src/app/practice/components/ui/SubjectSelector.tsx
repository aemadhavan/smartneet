// File: src/app/practice/components/ui/SubjectSelector.tsx
import { useState } from 'react';
import { Subject } from '@/app/practice/types';

interface SubjectSelectorProps {
  subjects: Subject[];
  onSelect: (subject: Subject) => void;
  isPremium?: boolean; // Added isPremium prop to check premium status
}

// Subject icon and styling configuration
const subjectIcons: Record<string, { 
  icon: string; 
  color: string; 
  bgColor: string;
  gradient: string;
  description: string;
  questionCount: number;
}> = {
  PHY: { 
    icon: '⚛️', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradient: 'from-blue-50 to-indigo-50',
    description: 'Study of matter, energy, and the interaction between them',
    questionCount: 180
  },
  CHEM: { 
    icon: '🧪', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    gradient: 'from-purple-50 to-pink-50',
    description: 'Study of substances, their properties, structure, and reactions',
    questionCount: 150
  },
  BOT: { 
    icon: '🌿', 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    gradient: 'from-green-50 to-emerald-50',
    description: 'Study of plants including their structure, properties, and biochemical processes',
    questionCount: 120
  },
  ZOO: { 
    icon: '🦒', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    gradient: 'from-yellow-50 to-amber-50',
    description: 'Study of animals and their interactions with ecosystems',
    questionCount: 130
  },
  // Fallback for any other subjects
  default: { 
    icon: '📚', 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    gradient: 'from-indigo-50 to-blue-50',
    description: 'Comprehensive study material for NEET preparation',
    questionCount: 100
  }
};

export function SubjectSelector({ subjects, onSelect, isPremium = false }: SubjectSelectorProps) {
  const [hoveredSubject, setHoveredSubject] = useState<number | null>(null);

  const getIconConfig = (subjectCode: string) => {
    return subjectIcons[subjectCode] || subjectIcons.default;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header section */}
      <div className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Choose Your Learning Path</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Select a subject to begin your practice session. Each subject contains curated questions from
          previous exams and AI-generated practice materials.
        </p>
      </div>
      
      {/* Subject cards grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
        {subjects.map((subject) => {
          const iconConfig = getIconConfig(subject.subject_code);
          const isHovered = hoveredSubject === subject.subject_id;
          
          return (
            <div
              key={subject.subject_id}
              className={`bg-gradient-to-br ${iconConfig.gradient} rounded-xl border border-gray-100 
                overflow-hidden transition-all duration-300 relative ${
                isHovered 
                  ? 'shadow-lg transform translate-y-[-4px]' 
                  : 'hover:shadow-md'
              }`}
              onMouseEnter={() => setHoveredSubject(subject.subject_id)}
              onMouseLeave={() => setHoveredSubject(null)}
              onClick={() => onSelect(subject)}
            >
              <div className="p-6 pb-16"> {/* Added padding at bottom to make room for button */}
                <div className="flex items-center mb-4">
                  <div className={`w-16 h-16 ${iconConfig.bgColor} ${iconConfig.color} rounded-full 
                    flex items-center justify-center text-3xl shadow-sm`}>
                    {iconConfig.icon}
                  </div>
                  <div className="ml-5">
                    <h2 className="text-2xl font-bold text-gray-800">{subject.subject_name}</h2>
                    <div className="inline-flex items-center mt-1">
                      <span className="text-sm font-medium text-gray-500 bg-white bg-opacity-70 
                        rounded-full px-3 py-1 shadow-sm border border-gray-200">
                        {subject.subject_code}
                      </span>
                      <span className="ml-3 text-sm text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" 
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {iconConfig.questionCount}+ questions
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 pl-1">{iconConfig.description}</p>
                
                <div className="flex items-center">
                  {/* Avatar placeholders - simulating active students */}
                  <div className="flex -space-x-2">
                    {['AB', 'SK', 'JP'].map((initials, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-white 
                        flex items-center justify-center text-xs font-medium shadow-sm">
                        {initials}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-white 
                      flex items-center justify-center text-xs text-gray-500 shadow-sm">
                      +{subject.subject_code === 'PHY' ? '7k' : 
                         subject.subject_code === 'CHEM' ? '6k' : 
                         subject.subject_code === 'BOT' ? '11k' : '13k'}
                    </div>
                  </div>
                </div>
                
                {/* Absolutely positioned button at the bottom right */}
                <div className="absolute bottom-4 right-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // If it's botany and user is not premium, navigate to URL with limit=free parameter
                      if (subject.subject_code === 'BOT' && !isPremium) {
                        window.location.href = `/practice?subject=botany&limit=free`;
                      } else {
                        // For other subjects or premium users, use the normal selection
                        onSelect(subject);
                      }
                    }}
                    className={`px-4 py-2 ${
                      // Enhanced contrast for Chemistry and Zoology buttons
                      subject.subject_code === 'CHEM' ? 'bg-purple-700' : 
                      subject.subject_code === 'ZOO' ? 'bg-yellow-700' :
                      iconConfig.color.replace('text', 'bg')
                    } rounded-lg text-white font-medium text-sm flex items-center transition-colors 
                    hover:bg-opacity-90 shadow-sm`}
                  >
                    Start Practice
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" 
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* NEET Preparation Tip section */}
      <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-50 to-blue-50 
        rounded-xl p-6 shadow-sm border border-indigo-100">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" 
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">NEET Preparation Tip</h3>
            <p className="text-gray-600">
              Regular practice with previous year questions is key to success. Focus on understanding 
              concepts rather than memorizing, and maintain a consistent study schedule.
            </p>
          </div>
        </div>
      </div>
      
      {/* Additional features and incentives */}
      <div className="max-w-5xl mx-auto mt-12 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-green-500 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" 
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Track Your Progress</h3>
          <p className="text-gray-600 text-sm">
            Monitor your performance with detailed analytics and personalized insights.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-blue-500 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" 
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Comprehensive Material</h3>
          <p className="text-gray-600 text-sm">
            Access a vast library of questions from previous NEET exams and AI-generated practice sets.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-purple-500 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" 
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Adaptive Learning</h3>
          <p className="text-gray-600 text-sm">
            Our AI adapts to your learning style and focuses on improving your weak areas.
          </p>
        </div>
      </div>
    </div>
  );
}