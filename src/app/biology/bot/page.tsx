// src/app/biology/bot/page.tsx
"use client";

import Link from 'next/link';

interface Topic {
  id: number;
  name: string;
  description: string;
  subtopicsCount: number;
}

export default function BotanyPage() {
  // These would typically come from an API, but hardcoded for demonstration
  const topics: Topic[] = [
    {
      id: 1,
      name: "Diversity in Living World",
      description: "Study of diversity among living organisms and principles of classification",
      subtopicsCount: 4
    },
    {
      id: 2,
      name: "Structural Organization in Plants",
      description: "Study of morphology and anatomy of plants",
      subtopicsCount: 3
    },
    {
      id: 3,
      name: "Cell Structure and Function",
      description: "Study of cell organelles and cellular processes",
      subtopicsCount: 5
    },
    {
      id: 4,
      name: "Plant Physiology",
      description: "Study of functional processes in plants including photosynthesis and respiration",
      subtopicsCount: 6
    },
    {
      id: 5,
      name: "Reproduction in Plants",
      description: "Study of reproductive processes and structures in plants",
      subtopicsCount: 4
    },
    {
      id: 6,
      name: "Genetics and Evolution",
      description: "Study of inheritance, variation and evolutionary processes in plants",
      subtopicsCount: 5
    },
    {
      id: 7,
      name: "Biology and Human Welfare",
      description: "Study of plants in relation to human welfare",
      subtopicsCount: 3
    },
    {
      id: 8,
      name: "Ecology and Environment",
      description: "Study of plants in relation to their environment",
      subtopicsCount: 4
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Botany</h1>
        <p className="text-gray-600 max-w-3xl">
          Botany, or plant biology, is the science of plant life and a branch of biology. It includes the study of plants, algae, and fungi.
        </p>
        <div className="mt-10 flex justify-center">
        <Link 
          href="/practice?subject=botany"
          className="bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 text-lg font-medium shadow-sm"
        >
          Practice Botany Questions
        </Link>
      </div>
      </header>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">NEET Botany Overview</h2>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-emerald-50 p-4 rounded-md">
            <p className="text-emerald-600 text-2xl font-bold mb-1">45</p>
            <p className="text-gray-600">Questions</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-md">
            <p className="text-emerald-600 text-2xl font-bold mb-1">180</p>
            <p className="text-gray-600">Marks</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-md">
            <p className="text-emerald-600 text-2xl font-bold mb-1">8</p>
            <p className="text-gray-600">Major Topics</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {topics.map((topic) => (
          <div key={topic.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{topic.name}</h3>
              <p className="text-gray-600 mb-4">{topic.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{topic.subtopicsCount} subtopics</span>
                <Link 
                  href={`/biology/bot/topics/${topic.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  Explore Topic →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>      
    </div>
  );
}
