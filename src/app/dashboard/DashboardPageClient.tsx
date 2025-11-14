// File: src/app/dashboard/DashboardPageClient.tsx
"use client";

import dynamic from 'next/dynamic';
import {
  DashboardHeader,
  StatsOverview,
  TopicMasteryPanel,
  QuickActionsPanel,
  RecentSessionsTable,
  LazyChart,
  AIRecommendationsPanel,
} from '@/components/dashboard';
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

interface DashboardPageClientProps {
  initialData: DashboardData;
}

export default function DashboardPageClient({ initialData }: DashboardPageClientProps) {
  const { stats } = initialData;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {initialData.hasError && (
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
            topicMastery={initialData.topicMastery}
            masteredTopics={stats.masteredTopics}
          />

          <QuickActionsPanel />
        </div>

        {/* Charts Column */}
        <div className="md:col-span-2">
          <LazyChart>
            <DashboardCharts
              performanceOverTime={initialData.performanceOverTime}
              subjectPerformance={initialData.subjectPerformance}
              questionTypeData={initialData.questionTypeData}
            />
          </LazyChart>
        </div>
      </div>

      {/* Recent Sessions */}
      <RecentSessionsTable sessions={initialData.recentSessions} />

      {/* AI Recommendations */}
      <AIRecommendationsPanel
        focusAreas={initialData.focusAreas}
        strongAreas={initialData.strongAreas}
        stats={stats}
      />
    </div>
  );
}
