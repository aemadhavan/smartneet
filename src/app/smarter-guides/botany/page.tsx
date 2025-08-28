//File: src/app/smarter-guides/botany/page.tsx
import { Metadata } from "next"
import Link from "next/link"
import BotanyContent from "./BotanyContent"

export const metadata: Metadata = {
  title: "Botany - NEET Preparation",
  description: "Comprehensive botany study guide for NEET exam preparation",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Botany - NEET Preparation",
    description: "Comprehensive botany study guide for NEET exam preparation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Botany - NEET Preparation",
    description: "Comprehensive botany study guide for NEET exam preparation",
  },
}


export default function BotanyPage() {
  return (
    <>
      <div className="container mx-auto px-4 pt-8">
        <Link href="/smarter-guides" className="text-blue-600 hover:underline inline-block mb-4">
          ← Back to Smarter Guides
        </Link>
      </div>
      <BotanyContent />
    </>
  )
}
