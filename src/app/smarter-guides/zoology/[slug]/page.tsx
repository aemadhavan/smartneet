import { Metadata } from "next"
import { notFound } from "next/navigation"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import fs from "fs"
import path from "path"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return {
    title: `${title} - Zoology NEET Guide`,
    description: `Study guide for ${title} in NEET zoology preparation`,
  }
}

export default async function SubtopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const contentPath = path.join(process.cwd(), "content", "zoology", `${slug}.md`)

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
    </div>
  )
} 