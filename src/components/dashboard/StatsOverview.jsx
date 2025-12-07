// File: src/components/dashboard/StatsOverview.jsx
import { BookOpen, CheckCircle, Clock, Flame } from 'lucide-react';
import { formatAccuracy } from '@/lib/dashboard/formatting';
import StatCard from './StatCard';

export default function StatsOverview({ stats }) {
  const hasAnyActivity =
    (stats?.totalSessions ?? 0) > 0 ||
    (stats?.totalQuestionsAttempted ?? 0) > 0 ||
    (stats?.totalCorrectAnswers ?? 0) > 0 ||
    (stats?.masteredTopics ?? 0) > 0;

  if (!hasAnyActivity) {
    return (
      <div className="mb-8 rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
          Welcome to your dashboard
        </p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Complete your first practice session to see your stats and insights here.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      <StatCard
        icon={<BookOpen size={24} />}
        iconBgColor="bg-emerald-100 text-emerald-600"
        label="Total Sessions"
        value={stats.totalSessions}
      />

      <StatCard
        icon={<CheckCircle size={24} />}
        iconBgColor="bg-indigo-100 text-indigo-600"
        label="Avg. Accuracy"
        value={formatAccuracy(stats.averageAccuracy)}
      />

      <StatCard
        icon={<Clock size={24} />}
        iconBgColor="bg-orange-100 text-orange-600"
        label="Study Time"
        value={`${stats.totalDurationMinutes} min`}
      />

      <StatCard
        icon={<Flame size={24} />}
        iconBgColor="bg-red-100 text-red-600"
        label="Current Streak"
        value={`${stats.streakCount} days`}
      />
    </div>
  );
}
