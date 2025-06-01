// File: src/app/study-guides/chemistry/page.tsx (Coming Soon Page)
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEET Chemistry Study Guides - Coming Soon | SmarterNEET",
  description: "Comprehensive NEET Chemistry study guides for Organic, Inorganic, and Physical Chemistry are coming soon. Get notified when they're available!",
  keywords: ["NEET Chemistry", "Chemistry notes", "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "NEET 2024"],
};

export default function ChemistryPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="bg-gray-50 py-4">
        <div className="container mx-auto max-w-7xl px-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/study-guides" className="hover:text-blue-600">Study Guides</Link>
            <span>/</span>
            <span className="text-gray-900">Chemistry</span>
          </div>
        </div>
      </nav>

      {/* Coming Soon Content */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-8 text-center">
          <div className="text-8xl mb-8">🧪</div>
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            NEET Chemistry Study Guides
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Comprehensive study materials for Organic, Inorganic, and Physical Chemistry are being prepared by our expert faculty.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">What&apos;s Coming Soon:</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 text-orange-600">📋 Organic Chemistry</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Hydrocarbons & their reactions</li>
                  <li>• Functional groups analysis</li>
                  <li>• Reaction mechanisms</li>
                  <li>• Named reactions for NEET</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 text-blue-600">⚗️ Inorganic Chemistry</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Periodic table trends</li>
                  <li>• Chemical bonding</li>
                  <li>• Coordination compounds</li>
                  <li>• Metallurgy processes</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3 text-green-600">🔬 Physical Chemistry</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Thermodynamics laws</li>
                  <li>• Chemical kinetics</li>
                  <li>• Electrochemistry</li>
                  <li>• Solutions & colligative properties</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-green-900">📅 Expected Launch</h2>
            <p className="text-lg text-green-700 mb-4">March 2024</p>
            <p className="text-gray-600">
              Our expert chemistry faculty is working on creating the most comprehensive 
              NEET Chemistry study guides with detailed explanations, reaction mechanisms, 
              and previous year question analysis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/study-guides/biology"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Explore Biology Guides
            </Link>
            <Link 
              href="/practice?subject=chemistry"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Practice Chemistry Questions
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}