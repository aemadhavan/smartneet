import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export default function EmptyState() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-amber-500 dark:text-amber-400 mb-6">
        <BookOpen size={64} />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">No Review Data</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8">There are no question attempts to review for this session.</p>
      <div className="flex space-x-4">
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}