// File: src/components/dashboard/AIRecommendationsPanel.jsx
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

const FocusAreasPanel = dynamic(() => import('./FocusAreasPanel'), {
  loading: () => <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
});

const StrongAreasPanel = dynamic(() => import('./StrongAreasPanel'), {
  loading: () => <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
});

const LearningInsightsPanel = dynamic(() => import('./LearningInsightsPanel'), {
  loading: () => <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
});

export default function AIRecommendationsPanel({ focusAreas, strongAreas, stats }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-8">
      <div className="flex items-start mb-4">
        <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold dark:text-white text-gray-800">AI-Powered Recommendations</h2>
          <p className="dark:text-gray-400 text-gray-600">Based on your performance and learning patterns</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mt-4">
        <FocusAreasPanel areas={focusAreas} />
        <StrongAreasPanel areas={strongAreas} />
        <LearningInsightsPanel stats={stats} />
      </div>
    </div>
  );
}