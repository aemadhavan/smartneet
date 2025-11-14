// File: src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import DashboardPageClient from './DashboardPageClient';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in?redirect=dashboard');
  }

  return <DashboardPageClient />;
}
