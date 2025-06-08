import { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Zoology - NEET Preparation",
  description: "Comprehensive zoology study guide for NEET exam preparation",
}

const topics = [
  {
    title: "Diversity in Living World",
    topicId: 9,
    description: "Main topic covering diversity in living world concepts and principles.",
    subtopics: [
      { title: "Animal Kingdom", subtopicId: 18, slug: "animal-kingdom", available: true },
    ],
  },
  {
    title: "Structural Organization in Animals and Plants",
    topicId: 10,
    description: "Main topic covering structural organization in animals and plants concepts and principles.",
    subtopics: [
      { title: "Structural Organization in Animals (Including Frog)", subtopicId: 19, slug: "structural-organization-in-animals-including-frog", available: true },
    ],
  },
  {
    title: "Cell Structure and Function",
    topicId: 11,
    description: "Main topic covering cell structure and function concepts and principles.",
    subtopics: [
      { title: "Biomolecules", subtopicId: 20, slug: "biomolecules", available: true },
    ],
  },
  {
    title: "Human Physiology",
    topicId: 12,
    description: "Main topic covering human physiology concepts and principles.",
    subtopics: [
      { title: "Breathing and Exchange of Gases", subtopicId: 21, slug: "breathing-and-exchange-of-gases", available: true },
      { title: "Body Fluids and Circulation", subtopicId: 22, slug: "body-fluids-and-circulation", available: true },
      { title: "Excretory Products & their Elimination", subtopicId: 23, slug: "excretory-products-and-their-elimination", available: true },
      { title: "Locomotion & Movement", subtopicId: 24, slug: "locomotion-and-movement", available: true },
      { title: "Neural Control & Coordination", subtopicId: 25, slug: "neural-control-and-coordination", available: true },
      { title: "Chemical Coordination & Integration", subtopicId: 26, slug: "chemical-coordination-and-integration", available: true },
    ],
  },
  {
    title: "Reproduction",
    topicId: 13,
    description: "Main topic covering reproduction concepts and principles.",
    subtopics: [
      { title: "Human Reproduction", subtopicId: 27, slug: "human-reproduction", available: true },
      { title: "Reproductive Health", subtopicId: 28, slug: "reproductive-health", available: true },
    ],
  },
  {
    title: "Genetics and Evolution",
    topicId: 14,
    description: "Main topic covering genetics and evolution concepts and principles.",
    subtopics: [
      { title: "Evolution", subtopicId: 29, slug: "evolution", available: true },
    ],
  },
  {
    title: "Biology and Human Welfare",
    topicId: 15,
    description: "Main topic covering biology and human welfare concepts and principles.",
    subtopics: [
      { title: "Human Health and Diseases", subtopicId: 30, slug: "human-health-and-diseases", available: true },
    ],
  },
  {
    title: "Biotechnology and Its Application",
    topicId: 16,
    description: "Main topic covering biotechnology and its application concepts and principles.",
    subtopics: [
      { title: "Biotechnology: Principles & Processes", subtopicId: 31, slug: "biotechnology-principles-and-processes", available: true },
    ],
  },
]

export default function ZoologyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Zoology</h1>
        <p className="text-xl text-gray-600">
          Comprehensive study materials for NEET zoology preparation
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
                    href={`/smarter-guides/zoology/${subtopic.slug}`}
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
