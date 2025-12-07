//File: src/app/biology/bot/page.tsx

import { Suspense } from 'react';
import BotanyContent from './BotanyContent';
import { db, withRetry } from '@/db';
import { topics } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

// Force static generation at build time
export const dynamic = 'force-static';
export const dynamicParams = true;

// Metadata for the page
export const metadata = {
  title: 'NEET Botany - Plant Biology Topics | SmarterNEET',
  description: 'Master NEET Botany with comprehensive topics covering plant biology, algae, and fungi. Practice questions on structural organization, diversity in living world, and more.',
};

interface TopicsWithSubtopicCount {
  topic_id: number;
  subject_id: number;
  topic_name: string;
  parent_topic_id: number | null;
  description: string | null;
  is_active: boolean | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  subtopicsCount: number;
}

// Server-side data fetching with optimized approach
async function getBotanyTopics(): Promise<TopicsWithSubtopicCount[]> {
  try {
    const botanySubjectId = 3;

    // Step 1: Get root topics and all subtopics in single queries
    const [rootTopics, allSubtopics] = await Promise.all([
      withRetry(async () => {
        return await db
          .select()
          .from(topics)
          .where(
            and(
              eq(topics.subject_id, botanySubjectId),
              isNull(topics.parent_topic_id),
              eq(topics.is_active, true)
            )
          );
      }),
      // Get all active subtopics for botany in one query
      withRetry(async () => {
        return await db
          .select()
          .from(topics)
          .where(
            and(
              eq(topics.subject_id, botanySubjectId),
              eq(topics.is_active, true)
            )
          );
      })
    ]);

    // Step 2: Count subtopics in memory (no additional DB queries)
    const topicsWithCounts = rootTopics.map((topic) => {
      const subtopicsCount = allSubtopics.filter(
        (subtopic) => subtopic.parent_topic_id === topic.topic_id
      ).length;

      return {
        ...topic,
        subtopicsCount,
      };
    });

    return topicsWithCounts;
  } catch (error) {
    console.error('Error fetching botany topics:', error);
    return [];
  }
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full max-w-3xl mb-4"></div>
        <div className="h-12 bg-gray-200 rounded w-64 mx-auto mt-10"></div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-emerald-50 p-4 rounded-md">
              <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Server Component - fetches data during SSR
export default async function BotanyPage() {
  // Fetch data on the server
  const topicsData = await getBotanyTopics();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BotanyContent initialTopics={topicsData} />
    </Suspense>
  );
}