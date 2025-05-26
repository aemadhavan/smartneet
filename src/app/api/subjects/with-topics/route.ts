// src/app/api/subjects/with-topics/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects, topics, topic_mastery } from '@/db/schema';
import { eq, and, count, inArray } from 'drizzle-orm'; // Added inArray
import { auth } from '@clerk/nextjs/server';

// Get subjects with topic counts and mastery information
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 1: Fetch all active subjects
    const allSubjects = await db
      .select({
        subject_id: subjects.subject_id,
        subject_name: subjects.subject_name,
        subject_code: subjects.subject_code
      })
      .from(subjects)
      .where(eq(subjects.is_active, true));

    // Step 2: If allSubjects is empty, return an empty array early.
    if (allSubjects.length === 0) {
      return NextResponse.json([]);
    }

    // Step 3: Get all relevant subject_ids from allSubjects.
    const subjectIds = allSubjects.map(s => s.subject_id);

    // Step 4: Fetch total active topic counts for these subjects in a single query
    const totalTopicCounts = await db
      .select({
        subject_id: topics.subject_id,
        count: count(topics.topic_id) // Drizzle will automatically name this 'count'
      })
      .from(topics)
      .where(and(
        eq(topics.is_active, true),
        inArray(topics.subject_id, subjectIds)
      ))
      .groupBy(topics.subject_id);

    const totalTopicCountsMap = new Map<number, number>();
    totalTopicCounts.forEach(item => {
      totalTopicCountsMap.set(item.subject_id, Number(item.count));
    });

    // Step 5: Fetch mastered topic counts by the user for these subjects in a single query
    const masteredTopicCounts = await db
      .select({
        subject_id: topics.subject_id,
        count: count(topic_mastery.topic_id) // Drizzle will automatically name this 'count'
      })
      .from(topic_mastery)
      .innerJoin(topics, eq(topic_mastery.topic_id, topics.topic_id))
      .where(and(
        eq(topic_mastery.user_id, userId),
        eq(topic_mastery.mastery_level, 'mastered'),
        inArray(topics.subject_id, subjectIds)
      ))
      .groupBy(topics.subject_id);

    const masteredTopicCountsMap = new Map<number, number>();
    masteredTopicCounts.forEach(item => {
      masteredTopicCountsMap.set(item.subject_id, Number(item.count));
    });

    // Step 6: Iterate through allSubjects and combine the data using the maps
    const subjectsWithTopics = allSubjects.map(subject => {
      const totalTopics = totalTopicCountsMap.get(subject.subject_id) || 0;
      const masteredTopics = masteredTopicCountsMap.get(subject.subject_id) || 0;
      return {
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        subject_code: subject.subject_code,
        topic_count: totalTopics,
        mastered_topics: masteredTopics
      };
    });

    // Step 7: Return subjectsWithTopics
    return NextResponse.json(subjectsWithTopics);
  } catch (error) {
    // Log the detailed error for server-side inspection
    console.error('Error fetching subjects with topics:', error instanceof Error ? error.message : String(error));
    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching subjects with topics.' },
      { status: 500 }
    );
  }
}