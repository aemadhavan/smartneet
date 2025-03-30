// src/app/admin/layout.tsx
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-xl font-bold mb-6">Admin Dashboard</h1>
        <nav className="space-y-2">
          <Link href="/admin/subjects" className="block p-2 hover:bg-gray-700 rounded">
            Subjects
          </Link>
          <Link href="/admin/topics" className="block p-2 hover:bg-gray-700 rounded">
            Topics
          </Link>
          <Link href="/admin/subtopics" className="block p-2 hover:bg-gray-700 rounded">
            Subtopics
          </Link>
          <Link href="/admin/questions" className="block p-2 hover:bg-gray-700 rounded">
            Questions
          </Link>
          <Link href="/admin/question-papers" className="block p-2 hover:bg-gray-700 rounded">
            Question Papers
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 bg-gray-100">
        {children}
      </div>
    </div>
  );
}