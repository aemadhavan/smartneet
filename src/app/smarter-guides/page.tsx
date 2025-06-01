import { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Beaker, Leaf, Microscope, Sparkles, UserCheck, Layers3, Clock } from "lucide-react"

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
    color: "bg-green-100 border-green-400",
    available: true,
  },
  {
    title: "Zoology",
    description: "Explore animal kingdom, human physiology, and evolution with smart guides",
    icon: Microscope,
    href: "/smarter-guides/zoology",
    color: "bg-blue-100 border-blue-400",
    available: false,
  },
  {
    title: "Chemistry",
    description: "Learn organic, inorganic, and physical chemistry concepts effectively",
    icon: Beaker,
    href: "/smarter-guides/chemistry",
    color: "bg-purple-100 border-purple-400",
    available: false,
  },
  {
    title: "Physics",
    description: "Understand mechanics, thermodynamics, and modern physics with AI assistance",
    icon: BookOpen,
    href: "/smarter-guides/physics",
    color: "bg-red-100 border-red-400",
    available: false,
  },
]

const whyChoose = [
  {
    icon: Sparkles,
    title: "AI-Curated Content",
    desc: "Content specifically selected and organized for NEET exam success",
  },
  {
    icon: UserCheck,
    title: "Personalized Learning",
    desc: "Adaptive study paths based on your strengths and weaknesses",
  },
  {
    icon: Layers3,
    title: "Comprehensive Coverage",
    desc: "Complete coverage of NEET syllabus with detailed explanations",
  },
]

export default function SmarterGuidesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Smarter Guides (Bodhi AI)</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered study guides curated specifically for NEET exam preparation.<br />
          Master your subjects with personalized learning paths and smart content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {subjects.map((subject) => (
          <div
            key={subject.title}
            className={`relative group rounded-2xl border-2 ${subject.color} p-8 shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg flex flex-col items-start bg-white overflow-hidden`}
          >
            <div className="absolute right-0 top-0 opacity-10 group-hover:opacity-20 transition-opacity w-32 h-32 rounded-full" style={{background: `radial-gradient(circle, ${subject.color.split(' ')[0]}, transparent 70%)`}} />
            <subject.icon className="h-12 w-12 mb-4 text-gray-900 z-10" />
            <h2 className="text-2xl font-semibold mb-2 z-10">{subject.title}</h2>
            <p className="text-gray-600 mb-4 z-10">{subject.description}</p>
            {subject.available ? (
              <Link
                href={subject.href}
                className="mt-auto inline-block bg-gradient-to-r from-blue-600 to-green-500 text-white px-6 py-2 rounded-lg font-semibold shadow hover:from-blue-700 hover:to-green-600 transition-colors"
              >
                Explore
              </Link>
            ) : (
              <span className="mt-auto inline-block bg-gray-200 text-gray-500 px-6 py-2 rounded-lg font-semibold cursor-not-allowed">
                <Clock className="inline-block w-4 h-4 mr-1 -mt-1" /> Coming Soon
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8">Why Choose Smarter Guides?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {whyChoose.map((item) => (
            <div key={item.title} className="p-8 bg-white rounded-2xl shadow flex flex-col items-center">
              <item.icon className="h-10 w-10 mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2 text-lg">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="mt-24 bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl py-12 px-6 text-center text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Start Your NEET Success Journey Today!</h2>
        <p className="text-lg mb-6 opacity-90">Join thousands of students using Smarter Guides to ace their NEET preparation with confidence.</p>
        <Link href="/sign-up" className="inline-block bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl shadow hover:bg-blue-50 transition-colors text-lg">
          Get Started Free
        </Link>
      </div>
    </div>
  )
} 