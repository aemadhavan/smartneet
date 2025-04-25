// File: src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { 
  DashboardHeader,
  LoadingSpinner,
  StatsOverview,
  TopicMasteryPanel,
  QuickActionsPanel,
  PerformanceChart,
  SubjectPerformanceChart,
  QuestionTypesPieChart,
  RecentSessionsTable,
  AIRecommendationsPanel  
} from '@/components/dashboard';
import { fetchDashboardData } from '@/lib/dashboard/data-fetching';
import { DashboardData } from '@/types/dashboard';

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
          <PerformanceChart data={dashboardData.performanceOverTime} />
          
          <div className="grid md:grid-cols-2 gap-6">
            <SubjectPerformanceChart data={dashboardData.subjectPerformance} />
            <QuestionTypesPieChart data={dashboardData.questionTypeData} />
          </div>
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