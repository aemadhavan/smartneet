// src/app/api/subjects/with-topics/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects, topics, topic_mastery } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// Get subjects with topic counts and mastery information
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, get all active subjects
    const allSubjects = await db
      .select({
        subject_id: subjects.subject_id,
        subject_name: subjects.subject_name,
        subject_code: subjects.subject_code
      })
      .from(subjects)
      .where(eq(subjects.is_active, true));

    // For each subject, get topic count and mastered topic count
    const subjectsWithTopics = await Promise.all(
      allSubjects.map(async (subject) => {
        // Get total topic count for this subject
        const topicCountResult = await db
          .select({ count: count() })
          .from(topics)
          .where(
            and(
              eq(topics.subject_id, subject.subject_id),
              eq(topics.is_active, true)
            )
          );
        
        // Get count of mastered topics for this subject
        const masteredTopicsResult = await db
          .select({ count: count() })
          .from(topic_mastery)
          .innerJoin(topics, eq(topic_mastery.topic_id, topics.topic_id))
          .where(
            and(
              eq(topics.subject_id, subject.subject_id),
              eq(topic_mastery.user_id, userId),
              eq(topic_mastery.mastery_level, 'mastered')
            )
          );

        return {
          subject_id: subject.subject_id,
          subject_name: subject.subject_name,
          subject_code: subject.subject_code,
          topic_count: Number(topicCountResult[0]?.count || 0),
          mastered_topics: Number(masteredTopicsResult[0]?.count || 0)
        };
      })
    );

    return NextResponse.json(subjectsWithTopics);
  } catch (error) {
    console.error('Error fetching subjects with topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects with topics' },
      { status: 500 }
    );
  }
}