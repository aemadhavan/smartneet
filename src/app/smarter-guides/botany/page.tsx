import { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Botany - NEET Preparation",
  description: "Comprehensive botany study guide for NEET exam preparation",
}

const topics = [
  {
    title: "Plant Diversity",
    subtopics: [
      { title: "Algae", slug: "algae" },
      { title: "Bryophytes", slug: "bryophytes" },
      { title: "Pteridophytes", slug: "pteridophytes" },
      { title: "Gymnosperms", slug: "gymnosperms" },
      { title: "Angiosperms", slug: "angiosperms" },
    ],
  },
  {
    title: "Plant Anatomy",
    subtopics: [
      { title: "Tissues", slug: "tissues" },
      { title: "Root System", slug: "root-system" },
      { title: "Stem Structure", slug: "stem-structure" },
      { title: "Leaf Structure", slug: "leaf-structure" },
    ],
  },
  {
    title: "Plant Physiology",
    subtopics: [
      { title: "Photosynthesis", slug: "photosynthesis" },
      { title: "Respiration", slug: "respiration" },
      { title: "Transpiration", slug: "transpiration" },
      { title: "Mineral Nutrition", slug: "mineral-nutrition" },
      { title: "Plant Growth", slug: "plant-growth" },
    ],
  },
  {
    title: "Plant Reproduction",
    subtopics: [
      { title: "Sexual Reproduction", slug: "sexual-reproduction" },
      { title: "Asexual Reproduction", slug: "asexual-reproduction" },
      { title: "Flower Structure", slug: "flower-structure" },
      { title: "Pollination", slug: "pollination" },
      { title: "Fertilization", slug: "fertilization" },
    ],
  },
  {
    title: "Genetics and Evolution",
    subtopics: [
      { title: "Mendelian Genetics", slug: "mendelian-genetics" },
      { title: "Molecular Genetics", slug: "molecular-genetics" },
      { title: "Plant Evolution", slug: "plant-evolution" },
      { title: "Plant Breeding", slug: "plant-breeding" },
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
          <div key={topic.title} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">{topic.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topic.subtopics.map((subtopic) => (
                <Link
                  key={subtopic.slug}
                  href={`/smarter-guides/botany/${subtopic.slug}`}
                  className="group flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">{subtopic.title}</span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 