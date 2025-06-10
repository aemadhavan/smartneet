import { Metadata } from "next"
import { notFound } from "next/navigation"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import fs from "fs"
import path from "path"
import Link from "next/link"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return {
    title: `${title} - Botany NEET Guide`,
    description: `Study guide for ${title} in NEET botany preparation`,
  }
}

export default async function SubtopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const contentPath = path.join(process.cwd(), "content", "botany", `${slug}.md`)

  let content: string
  try {
    content = await fs.promises.readFile(contentPath, "utf8")
  } catch {
    notFound()
  }

  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{title}</h1>
        <div className="prose prose-lg max-w-none">
          <MarkdownRenderer content={content} />
        </div>
      </div>
      
      {/* Floating Practice Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link 
          href={`/biology/bot`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
        >
          <span>Practice Now</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  )
} 