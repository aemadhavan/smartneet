// File: src/components/dashboard/SessionRow.jsx
import Link from 'next/link';
import { formatDate, formatAccuracy } from '@/lib/dashboard/formatting';

export default function SessionRow({ session }) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400 text-gray-500">
        {formatDate(session.start_time)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white text-gray-900">
        {session.subject_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400 text-gray-500">
        {session.topic_name || 'All Topics'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400 text-gray-500">
        {session.score ?? 0}/{session.max_score ?? 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span 
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
            ${session.accuracy >= 80 ? 'bg-green-100 text-green-800' : 
              session.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'}`}
        >
          {formatAccuracy(session.accuracy)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400 text-gray-500">
        {session.duration_minutes ?? 0} min
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Link 
          href={`/sessions/${session.session_id}`}
          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Review
        </Link>
      </td>
    </tr>
  );
}