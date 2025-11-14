// File: src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import DashboardPageClient from './DashboardPageClient';
import { fetchDashboardDataServer } from '@/lib/dashboard/server-data';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in?redirect=dashboard');
  }

  const dashboardData = await fetchDashboardDataServer(user.id);

  return <DashboardPageClient initialData={dashboardData} />;
}
