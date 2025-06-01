// File: src/app/study-guides/physics/page.tsx (Coming Soon Page)
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEET Physics Study Guides - Coming Soon | SmarterNEET",
  description: "Comprehensive NEET Physics study guides covering Mechanics, Thermodynamics, Optics, and Modern Physics are coming soon. Stay tuned!",
  keywords: ["NEET Physics", "Physics notes", "Mechanics", "Thermodynamics", "Optics", "Modern Physics", "NEET 2024"],
};

export default function PhysicsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="bg-gray-50 py-4">
        <div className="container mx-auto max-w-7xl px-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/study-guides" className="hover:text-blue-600">Study Guides</Link>
            <span>/</span>
            <span className="text-gray-900">Physics</span>
          </div>
        </div>
      </nav>

      {/* Coming Soon Content */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-8 text-center">
          <div className="text-8xl mb-8">⚛️</div>
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            NEET Physics Study Guides
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Detailed study materials for all Physics topics with solved examples, derivations, and conceptual explanations are in development.
          </p>
          
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4 text-purple-900">What&apos;s Coming Soon:</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 text-blue-600">🏃‍♂️ Mechanics</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Kinematics & dynamics</li>
                  <li>• Work, energy & power</li>
                  <li>• Rotational motion</li>
                  <li>• Gravitation & SHM</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 text-red-600">🌡️ Heat & Thermodynamics</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Laws of thermodynamics</li>
                  <li>• Heat transfer mechanisms</li>
                  <li>• Kinetic theory of gases</li>
                  <li>• Thermal expansion</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 text-yellow-600">💡 Optics & Waves</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Wave motion & sound</li>
                  <li>• Geometric optics</li>
                  <li>• Wave optics</li>
                  <li>• Electromagnetic waves</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 text-green-600">⚡ Modern Physics</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Atomic structure</li>
                  <li>• Nuclear physics</li>
                  <li>• Photoelectric effect</li>
                  <li>• Semiconductor devices</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">📅 Expected Launch</h2>
            <p className="text-lg text-blue-700 mb-4">April 2024</p>
            <p className="text-gray-600">
              Our physics experts are creating comprehensive guides with step-by-step 
              derivations, numerical problem solutions, and conceptual clarity for 
              all NEET Physics topics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/study-guides/biology"
              className="bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Explore Biology Guides
            </Link>
            <Link 
              href="/practice?subject=physics"
              className="bg-white text-purple-600 border-2 border-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
            >
              Practice Physics Questions
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}