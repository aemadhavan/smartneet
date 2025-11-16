import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Sessions - SmarterNEET | NEET Question Practice',
  description: 'Start your NEET practice session with customized tests. Choose topics, difficulty levels, and question counts. Track your performance with detailed analytics and improve your NEET exam scores.',
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
