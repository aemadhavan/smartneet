"use client";

import dynamic from 'next/dynamic';
import { DashboardData } from '@/types/dashboard';

const PerformanceChart = dynamic(() => import('./PerformanceChart'), {
  loading: () => <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 h-80 animate-pulse"><div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div></div>,
  ssr: false
});

const SubjectPerformanceChart = dynamic(() => import('./SubjectPerformanceChart'), {
  loading: () => <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse"><div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div></div>,
  ssr: false
});

const QuestionTypesPieChart = dynamic(() => import('./QuestionTypesPieChart'), {
  loading: () => <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-80 animate-pulse"><div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div></div>,
  ssr: false
});

interface DashboardChartsProps {
  performanceOverTime: DashboardData['performanceOverTime'];
  subjectPerformance: DashboardData['subjectPerformance'];
  questionTypeData: DashboardData['questionTypeData'];
}

export default function DashboardCharts({ 
  performanceOverTime, 
  subjectPerformance, 
  questionTypeData 
}: DashboardChartsProps) {
  return (
    <>
      <PerformanceChart data={performanceOverTime} />
      
      <div className="grid md:grid-cols-2 gap-6">
        <SubjectPerformanceChart data={subjectPerformance} />
        <QuestionTypesPieChart data={questionTypeData} />
      </div>
    </>
  );
}