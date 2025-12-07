import { Metadata } from "next"
import { notFound } from "next/navigation"
import { renderMarkdownToHTML } from "@/lib/markdown"
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

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "content", "botany")
  const files = await fs.promises.readdir(contentDir)

  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(/\.md$/, ""),
    }))
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

  const htmlContent = await renderMarkdownToHTML(content);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/smarter-guides/botany"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Botany
        </Link>
        <h1 className="text-4xl font-bold mb-8">{title}</h1>
        <div className="prose prose-lg max-w-none">
          <div
            className="prose prose-lg max-w-none dark:prose-invert prose-pre:bg-transparent"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
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