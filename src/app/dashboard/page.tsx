// File: src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  DashboardHeader,
  LoadingSpinner,
  StatsOverview,
  TopicMasteryPanel,
  QuickActionsPanel,
  RecentSessionsTable,
  LazyChart
} from '@/components/dashboard';
import { fetchDashboardData } from '@/lib/dashboard/data-fetching';
import { DashboardData } from '@/types/dashboard';

// Dynamically import dashboard sections to reduce initial bundle size  
const DashboardCharts = dynamic(() => import('@/components/dashboard/DashboardCharts'), {
  loading: () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false
});

const AIRecommendationsPanel = dynamic(() => import('@/components/dashboard/AIRecommendationsPanel'), {
  loading: () => <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-40 animate-pulse"><div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div></div>,
  ssr: false
});

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  
  // State for dashboard data with proper typing
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    recentSessions: [],
    topicMastery: [],
    stats: {
      totalSessions: 0,
      totalQuestionsAttempted: 0,
      totalCorrectAnswers: 0,
      averageAccuracy: 0,
      totalDurationMinutes: 0,
      streakCount: 0,
      masteredTopics: 0
    },
    questionTypeData: [],
    subjectPerformance: [],
    performanceOverTime: [],
    focusAreas: [],
    strongAreas: []
  });

  // Main data fetching function
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data as DashboardData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=dashboard');
      return;
    }
    
    if (isSignedIn) {
      loadDashboardData();
    }
  }, [isSignedIn, isLoaded, router, loadDashboardData]);
  
  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <DashboardHeader />
      
      {/* Overview Stats */}
      <StatsOverview stats={dashboardData.stats} />
      
      {/* Main Dashboard Content */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Topic Mastery Column */}
        <div className="md:col-span-1">
          <TopicMasteryPanel 
            topicMastery={dashboardData.topicMastery} 
            masteredTopics={dashboardData.stats.masteredTopics} 
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
        stats={dashboardData.stats}
      />
    </div>
  );
}