// File: src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { currentUser } from '@clerk/nextjs/server';
import DashboardPageClient from './DashboardPageClient';
import { fetchDashboardDataServer } from '@/lib/dashboard/server-data';

export const metadata: Metadata = {
  title: 'Your Learning Dashboard | SmarterNEET',
  description:
    'View your NEET practice stats, topic mastery, recent sessions, and personalized recommendations in one place on your SmarterNEET dashboard.',
};

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in?redirect=dashboard');
  }

  const dashboardData = await fetchDashboardDataServer(user.id);

  return <DashboardPageClient initialData={dashboardData} />;
}
