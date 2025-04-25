// File: src/components/dashboard/StatsOverview.jsx
import { BookOpen, CheckCircle, Clock, Flame } from 'lucide-react';
import { formatAccuracy } from '@/lib/dashboard/formatting';
import StatCard from './StatCard';

export default function StatsOverview({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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