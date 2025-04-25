// File: src/components/dashboard/RecentSessionsTable.jsx
import Link from 'next/link';
import { formatDate, formatAccuracy } from '@/lib/dashboard/formatting';
import SessionRow from './SessionRow';

export default function RecentSessionsTable({ sessions }) {
  return (
    <>
      <h2 className="text-xl font-semibold dark:text-white text-gray-800 mb-4">Recent Sessions</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center dark:text-gray-400 text-gray-500">
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