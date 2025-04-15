// src/app/biology/zoo/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Topic {
  id: number;
  name: string;
  description: string;
  subtopicsCount: number;
}

export default function ZoologyPage() {
  // These would typically come from an API, but hardcoded for demonstration
  const topics: Topic[] = [
    {
      id: 9,
      name: "Diversity in Living World",
      description: "Study of animal diversity and classification principles",
      subtopicsCount: 3
    },
    {
      id: 10,
      name: "Structural Organization in Animals",
      description: "Study of morphology and anatomy of animals",
      subtopicsCount: 4
    },
    {
      id: 11,
      name: "Cell Structure and Function",
      description: "Study of cell organelles and cellular processes in animal cells",
      subtopicsCount: 5
    },
    {
      id: 12,
      name: "Human Physiology",
      description: "Study of physiological processes in human body systems",
      subtopicsCount: 7
    },
    {
      id: 13,
      name: "Reproduction in Animals",
      description: "Study of reproductive processes and structures in animals",
      subtopicsCount: 4
    },
    {
      id: 14,
      name: "Genetics and Evolution",
      description: "Study of inheritance, variation and evolutionary processes in animals",
      subtopicsCount: 5
    },
    {
      id: 15,
      name: "Biology and Human Welfare",
      description: "Study of animals in relation to human welfare including health and diseases",
      subtopicsCount: 3
    },
    {
      id: 16,
      name: "Biotechnology and Its Application",
      description: "Study of techniques and applications in animal biotechnology",
      subtopicsCount: 2
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Zoology</h1>
        <p className="text-gray-600 max-w-3xl">
          Zoology is the branch of biology that studies the animal kingdom, including the structure, embryology, evolution, classification, habits, and distribution of all animals.
        </p>
        <div className="mt-10 flex justify-center">
          <Link 
            href="/practice?subject=zoology"
            className="bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700 text-lg font-medium shadow-sm"
          >
            Practice Zoology Questions
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">NEET Zoology Overview</h2>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-amber-50 p-4 rounded-md">
            <p className="text-amber-600 text-2xl font-bold mb-1">45</p>
            <p className="text-gray-600">Questions</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-md">
            <p className="text-amber-600 text-2xl font-bold mb-1">180</p>
            <p className="text-gray-600">Marks</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-md">
            <p className="text-amber-600 text-2xl font-bold mb-1">8</p>
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
                  href={`/biology/zoo/topics/${topic.id}`}
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