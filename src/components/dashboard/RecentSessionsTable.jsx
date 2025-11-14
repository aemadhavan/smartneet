// File: src/components/dashboard/RecentSessionsTable.jsx
import Link from 'next/link';
import { formatDate, formatAccuracy } from '@/lib/dashboard/formatting';
import SessionRow from './SessionRow';

export default function RecentSessionsTable({ sessions }) {
  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">Recent Sessions</h2>
      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Subject</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Topic</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Accuracy</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No session history yet. Start practicing to see your progress!
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <SessionRow key={session.session_id} session={session} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
