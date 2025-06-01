// File: src/app/study-guides/layout.tsx (Optional - Shared Layout)
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | SmarterNEET Study Guides',
    default: 'NEET Study Guides | SmarterNEET',
  },
  description: 'Free comprehensive NEET study guides for Biology, Physics, and Chemistry preparation.',
};

export default function StudyGuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}