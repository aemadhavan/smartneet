//File: src/app/smarter-guides/botany/page.tsx
import { Metadata } from "next"
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
  return <BotanyContent />
}