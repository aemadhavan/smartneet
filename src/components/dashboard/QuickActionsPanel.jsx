// File: src/components/dashboard/QuickActionsPanel.jsx
import Link from 'next/link';
import { BookOpen, BookMarked } from 'lucide-react';
import QuickActionCard from './QuickActionCard';

export default function QuickActionsPanel() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        <QuickActionCard 
          href="/practice?subject=botany"
          bgColor="bg-emerald-50 hover:bg-emerald-100"
          textColor="text-emerald-800"
          icon={<BookOpen className="mr-3" size={20} />}
          title="Practice Botany"
          description="20 personalized questions"
          descriptionColor="text-emerald-700"
        />
        
        <QuickActionCard 
          href="/practice?subject=zoology"
          bgColor="bg-blue-50 hover:bg-blue-100"
          textColor="text-blue-800"
          icon={<BookOpen className="mr-3" size={20} />}
          title="Practice Zoology"
          description="20 personalized questions"
          descriptionColor="text-blue-700"
        />
        
        <QuickActionCard 
          href="/bookmarks"
          bgColor="bg-yellow-50 hover:bg-yellow-100"
          textColor="text-yellow-800"
          icon={<BookMarked className="mr-3" size={20} />}
          title="Review Bookmarks"
          description="12 bookmarked questions"
          descriptionColor="text-yellow-700"
        />
      </div>
    </div>
  );
}