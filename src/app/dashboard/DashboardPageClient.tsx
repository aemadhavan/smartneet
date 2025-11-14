// File: src/app/dashboard/DashboardPageClient.tsx
"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  DashboardHeader,
  StatsOverview,
  TopicMasteryPanel,
  QuickActionsPanel,
  RecentSessionsTable,
  LazyChart,
  AIRecommendationsPanel,
  LoadingSpinner,
} from '@/components/dashboard';
import { fetchDashboardData } from '@/lib/dashboard/data-fetching';
import { DashboardData } from '@/types/dashboard';

// Dynamically import dashboard sections to reduce initial bundle size
const DashboardCharts = dynamic(() => import('@/components/dashboard/DashboardCharts'), {
  loading: () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

export default function DashboardPageClient() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = (await fetchDashboardData()) as DashboardData;
        if (!cancelled) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !dashboardData) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  const { stats } = dashboardData;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {dashboardData.hasError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          We couldnt load some of your stats. Data may be incomplete. Please try refreshing the page.
        </div>
      )}

      <DashboardHeader />

      {/* Overview Stats */}
      <StatsOverview stats={stats} />

      {/* Main Dashboard Content */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Topic Mastery Column */}
        <div className="md:col-span-1">
          <TopicMasteryPanel
            topicMastery={dashboardData.topicMastery}
            masteredTopics={stats.masteredTopics}
          />

          <QuickActionsPanel />
        </div>

        {/* Charts Column */}
        <div className="md:col-span-2">
          <LazyChart>
            <DashboardCharts
              performanceOverTime={dashboardData.performanceOverTime}
              subjectPerformance={dashboardData.subjectPerformance}
              questionTypeData={dashboardData.questionTypeData}
            />
          </LazyChart>
        </div>
      </div>

      {/* Recent Sessions */}
      <RecentSessionsTable sessions={dashboardData.recentSessions} />

      {/* AI Recommendations */}
      <AIRecommendationsPanel
        focusAreas={dashboardData.focusAreas}
        strongAreas={dashboardData.strongAreas}
        stats={stats}
      />
    </div>
  );
}
