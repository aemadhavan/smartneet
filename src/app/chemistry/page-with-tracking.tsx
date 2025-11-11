//File: src/app/chemistry/page-with-tracking.tsx
// This is an example showing how to integrate performance tracking
// You can replace page.tsx with this file after testing

import ChemistryContent from './ChemistryContent';
import { db, withRetry } from '@/db';
import { topics } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { trackedQuery, logPerformance } from '@/lib/performance';

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

// Force static generation at build time
export const dynamic = 'force-static';
export const dynamicParams = true;

// Prefetch priority for critical content
export const fetchCache = 'force-cache';

// Metadata for the page
export const metadata = {
  title: 'NEET Chemistry - Complete Topics & Practice | SmarterNEET',
  description: 'Master NEET Chemistry with comprehensive topics covering physical, organic, and inorganic chemistry. Practice questions on chemical reactions, bonding, thermodynamics, and more.',
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

// Server-side data fetching with performance tracking
async function getChemistryTopics(): Promise<TopicsWithSubtopicCount[]> {
  const pageStartTime = performance.now();

  try {
    const chemistrySubjectId = 2;

    // Step 1: Get root topics and all subtopics with performance tracking
    const [rootTopics, allSubtopics] = await Promise.all([
      trackedQuery(
        async () => {
          return await withRetry(async () => {
            return await db
              .select()
              .from(topics)
              .where(
                and(
                  eq(topics.subject_id, chemistrySubjectId),
                  isNull(topics.parent_topic_id),
                  eq(topics.is_active, true)
                )
              )
              .limit(100);
          });
        },
        'getChemistryRootTopics'
      ),
      trackedQuery(
        async () => {
          return await withRetry(async () => {
            return await db
              .select()
              .from(topics)
              .where(
                and(
                  eq(topics.subject_id, chemistrySubjectId),
                  eq(topics.is_active, true)
                )
              )
              .limit(500);
          });
        },
        'getChemistryAllTopics'
      )
    ]);

    // Step 2: Count subtopics in memory (no additional DB queries)
    const processingStartTime = performance.now();

    const topicsWithCounts = rootTopics.map((topic) => {
      const subtopicsCount = allSubtopics.filter(
        (subtopic) => subtopic.parent_topic_id === topic.topic_id
      ).length;

      return {
        ...topic,
        subtopicsCount,
      };
    });

    logPerformance('Chemistry: In-memory processing', processingStartTime);
    logPerformance('Chemistry: Total page generation', pageStartTime);

    return topicsWithCounts;
  } catch (error) {
    console.error('Error fetching chemistry topics:', error);
    logPerformance('Chemistry: Failed page generation', pageStartTime);
    return [];
  }
}

// Server Component - fetches data during SSR
export default async function ChemistryPage() {
  // Fetch data on the server with performance tracking
  const topicsData = await getChemistryTopics();

  // Return content directly without Suspense for faster LCP
  return <ChemistryContent initialTopics={topicsData} />;
}
