//File: src/app/smarter-guides/botany/page.tsx
import { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Botany - NEET Preparation",
  description: "Comprehensive botany study guide for NEET exam preparation",
}

// Updated topics based on actual database structure from Excel
const topics = [
  {
    title: "Diversity in Living World",
    topicId: 1,
    description: "Main topic covering diversity in living world concepts and principles.",
    subtopics: [
      { title: "The Living World", subtopicId: 1, slug: "the-living-world", available: true },
      { title: "Biological Classification", subtopicId: 2, slug: "biological-classification", available: true },
      { title: "Plant Kingdom", subtopicId: 3, slug: "plant-kingdom", available: true },
    ],
  },
  {
    title: "Structural Organization in Animals and Plants",
    topicId: 2,
    available: false,
    description: "Main topic covering structural organization in animals and plants concepts and principles.",
    subtopics: [
      { title: "Morphology of Flowering Plants", subtopicId: 4, slug: "morphology-of-flowering-plants", available: true },
      { title: "Anatomy of Flowering Plants", subtopicId: 5, slug: "anatomy-of-flowering-plants", available: true },
    ],
  },
  {
    title: "Cell Structure and Function",
    topicId: 3,
    available: false,
    description: "Main topic covering cell structure and function concepts and principles.",
    subtopics: [
      { title: "Cell - The Unit of Life", subtopicId: 6, slug: "cell-the-unit-of-life", available: true },
      { title: "Cell Cycle and Cell Division", subtopicId: 7, slug: "cell-cycle-and-cell-division", available: true },
    ],
  },
  {
    title: "Plant Physiology",
    topicId: 4,
    available: false,
    description: "Main topic covering plant physiology concepts and principles.",
    subtopics: [
      { title: "Photosynthesis in Higher Plants", subtopicId: 8, slug: "photosynthesis-in-higher-plants", available: true },
      { title: "Respiration in Plants", subtopicId: 9, slug: "respiration-in-plants", available: false },
      { title: "Plant Growth and Development", subtopicId: 10, slug: "plant-growth-and-development", available: false },
    ],
  },
  {
    title: "Reproduction",
    topicId: 5,
    available: false,
    description: "Main topic covering reproduction concepts and principles.",
    subtopics: [
      { title: "Sexual Reproduction in Flowering Plant", subtopicId: 11, slug: "sexual-reproduction-in-flowering-plant", available: false },
    ],
  },
  {
    title: "Genetics and Evolution",
    topicId: 6,
    available: false,
    description: "Main topic covering genetics and evolution concepts and principles.",
    subtopics: [
      { title: "Principle of Inheritance and Variation", subtopicId: 12, slug: "principle-of-inheritance-and-variation", available: false },
      { title: "Molecular Basis of Inheritance", subtopicId: 13, slug: "molecular-basis-of-inheritance", available: false },
    ],
  },
  {
    title: "Biology and Human Welfare",
    topicId: 7,
    available: false,
    description: "Main topic covering biology and human welfare concepts and principles.",
    subtopics: [
      { title: "Microbes in Human Welfare", subtopicId: 14, slug: "microbes-in-human-welfare", available: false },
    ],
  },
  {
    title: "Ecology and Environment",
    topicId: 8,
    available: false,
    description: "Main topic covering ecology and environment concepts and principles.",
    subtopics: [
      { title: "Organisms and Population", subtopicId: 15, slug: "organisms-and-population", available: false },
      { title: "Ecosystem", subtopicId: 16, slug: "ecosystem", available: false },
      { title: "Biodiversity and Conservation", subtopicId: 17, slug: "biodiversity-and-conservation", available: false },
    ],
  },
]

export default function BotanyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Botany</h1>
        <p className="text-xl text-gray-600">
          Comprehensive study materials for NEET botany preparation
        </p>
      </div>

      <div className="grid gap-8">
        {topics.map((topic) => (
          <div key={topic.topicId} className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2">{topic.title}</h2>
              <p className="text-gray-600 text-sm">{topic.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topic.subtopics.map((subtopic) => (
                subtopic.available ? (
                  <Link
                    key={subtopic.subtopicId}
                    href={`/smarter-guides/botany/${subtopic.slug}`}
                    className="group flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{subtopic.title}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </Link>
                ) : (
                  <div
                    key={subtopic.subtopicId}
                    className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 cursor-not-allowed"
                  >
                    <span className="font-medium text-gray-500">{subtopic.title} - Guide Coming Soon</span>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}