// src/app/biology/page.tsx
"use client";

import Link from 'next/link';

// Define subject card interfaces
interface SubjectCard {
  id: number;
  name: string;
  code: string;
  description: string;
  image: string;
  bgColor: string;
  topics: number;
}

const BiologyPage = () => {
  // Define biology subject cards
  const subjects: SubjectCard[] = [
    {
      id: 3,
      name: "Botany",
      code: "BOT",
      description: "Study of plant life, including structure, growth, reproduction, evolution, and metabolism.",
      image: "/images/botany.jpg",
      bgColor: "bg-emerald-100",
      topics: 8
    },
    {
      id: 4,
      name: "Zoology",
      code: "ZOO", 
      description: "Study of animals, including their structure, physiology, development, evolution, and classification.",
      image: "/images/zoology.jpg",
      bgColor: "bg-amber-100",
      topics: 8
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Biology for NEET</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Prepare for NEET Biology with comprehensive practice questions covering both Botany and Zoology sections.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {subjects.map((subject) => (
          <Link 
            href={`/biology/${subject.code.toLowerCase()}`} 
            key={subject.id}
            className={`${subject.bgColor} rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-lg hover:-translate-y-1 flex flex-col h-full`}
          >
            <div className="relative h-48 w-full">
              {/* Fallback image if the specified one doesn't exist */}
              <div className={`absolute inset-0 flex items-center justify-center ${subject.name === 'Botany' ? 'bg-emerald-200' : 'bg-amber-200'}`}>
                <span className="text-4xl">
                  {subject.name === 'Botany' ? '🌿' : '🦁'}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-gray-800">{subject.name}</h2>
                <span className="px-2 py-1 bg-white rounded text-sm font-medium text-gray-600">
                  {subject.topics} Topics
                </span>
              </div>
              <p className="text-gray-600 mb-4">{subject.description}</p>
              <div className="mt-auto pt-4">
                <button className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                  Start Studying
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 bg-gray-50 rounded-lg p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">About NEET Biology</h2>
        <p className="text-gray-600 mb-3">
          The Biology section of NEET comprises 90 questions, divided equally between Botany and Zoology.
          Each question carries 4 marks, with a negative marking of 1 mark for incorrect answers.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white p-4 rounded-md shadow-sm">
            <h3 className="font-medium text-lg text-gray-800 mb-2">Botany Topics</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>Diversity in Living World</li>
              <li>Structural Organization in Plants</li>
              <li>Cell Structure and Function</li>
              <li>Plant Physiology</li>
              <li>Reproduction in Plants</li>
              <li>Genetics and Evolution</li>
              <li>Biology and Human Welfare</li>
              <li>Ecology and Environment</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm">
            <h3 className="font-medium text-lg text-gray-800 mb-2">Zoology Topics</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>Diversity in Living World</li>
              <li>Structural Organization in Animals</li>
              <li>Cell Structure and Function</li>
              <li>Human Physiology</li>
              <li>Reproduction in Animals</li>
              <li>Genetics and Evolution</li>
              <li>Biology and Human Welfare</li>
              <li>Biotechnology and Its Application</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiologyPage;
