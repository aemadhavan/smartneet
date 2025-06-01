import { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Beaker, Leaf, Microscope } from "lucide-react"

export const metadata: Metadata = {
  title: "Smarter Guides - NEET Preparation",
  description: "AI-powered study guides for NEET exam preparation in Botany, Zoology, Chemistry, and Physics",
}

const subjects = [
  {
    title: "Botany",
    description: "Master plant biology, morphology, and physiology with AI-curated content",
    icon: Leaf,
    href: "/smarter-guides/botany",
    color: "bg-green-500",
  },
  {
    title: "Zoology",
    description: "Explore animal kingdom, human physiology, and evolution with smart guides",
    icon: Microscope,
    href: "/smarter-guides/zoology",
    color: "bg-blue-500",
  },
  {
    title: "Chemistry",
    description: "Learn organic, inorganic, and physical chemistry concepts effectively", 
    icon: Beaker,
    href: "/smarter-guides/chemistry",
    color: "bg-purple-500",
  },
  {
    title: "Physics",
    description: "Understand mechanics, thermodynamics, and modern physics with AI assistance",
    icon: BookOpen,
    href: "/smarter-guides/physics",
    color: "bg-red-500",
  },
]

export default function SmarterGuidesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Smarter Guides (Bodhi AI)</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered study guides curated specifically for NEET exam preparation.
          Master your subjects with personalized learning paths and smart content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subjects.map((subject) => (
          <Link
            key={subject.title}
            href={subject.href}
            className="group relative overflow-hidden rounded-lg border bg-white p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className={`${subject.color} absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="relative">
              <subject.icon className="h-12 w-12 mb-4 text-gray-900" />
              <h2 className="text-2xl font-semibold mb-2">{subject.title}</h2>
              <p className="text-gray-600">{subject.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Why Choose Smarter Guides?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">AI-Curated Content</h3>
            <p className="text-gray-600">Content specifically selected and organized for NEET exam success</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Personalized Learning</h3>
            <p className="text-gray-600">Adaptive study paths based on your strengths and weaknesses</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Comprehensive Coverage</h3>
            <p className="text-gray-600">Complete coverage of NEET syllabus with detailed explanations</p>
          </div>
        </div>
      </div>
    </div>
  )
} 