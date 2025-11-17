//File: src/app/physics/page.tsx

import PhysicsContent from './PhysicsContent';
import { db, withRetry } from '@/db';
import { topics } from '@/db/schema';
import { eq, isNull, and, asc } from 'drizzle-orm';

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

// Force static generation at build time
export const dynamic = 'force-static';
export const dynamicParams = true;

// Prefetch priority for critical content
export const fetchCache = 'force-cache';

// Metadata for the page
export const metadata = {
  title: 'NEET Physics - Complete Topics & Practice | SmarterNEET',
  description: 'Master NEET Physics with comprehensive topics covering mechanics, thermodynamics, electromagnetism, optics, modern physics, and more. Practice questions to excel in your NEET exam.',
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
async function getPhysicsTopics(): Promise<TopicsWithSubtopicCount[]> {
  try {
    const physicsSubjectId = 1;

    // Step 1: Get root topics and all subtopics in single queries with optimized execution
    const [rootTopics, allSubtopics] = await Promise.all([
      withRetry(async () => {
        return await db
          .select()
          .from(topics)
          .where(
            and(
              eq(topics.subject_id, physicsSubjectId),
              isNull(topics.parent_topic_id),
              eq(topics.is_active, true)
            )
          )
          .orderBy(asc(topics.topic_id))
          .limit(100); // Add limit for better query performance
      }),
      // Get all active subtopics for physics in one query
      withRetry(async () => {
        return await db
          .select()
          .from(topics)
          .where(
            and(
              eq(topics.subject_id, physicsSubjectId),
              eq(topics.is_active, true)
            )
          )
          .limit(500); // Add limit for better query performance
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
    console.error('Error fetching physics topics:', error);
    return [];
  }
}


// Server Component - fetches data during SSR
export default async function PhysicsPage() {
  // Fetch data on the server with higher priority
  const topicsData = await getPhysicsTopics();

  // Return content directly without Suspense for faster LCP
  return <PhysicsContent initialTopics={topicsData} />;
}
