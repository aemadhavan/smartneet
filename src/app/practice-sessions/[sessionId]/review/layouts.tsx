// src/app/practice-sessions/[sessionId]/review/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review Practice Session | SmartNEET',
  description: 'Review your practice session answers and explanations',
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </div>
  );
}