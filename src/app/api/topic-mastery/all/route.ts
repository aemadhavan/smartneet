// src/app/api/topic-mastery/all/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { topic_mastery, topics, subjects } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch complete topic mastery data with subject information
    const masteryData = await db.select({
      topic_id: topics.topic_id,
      topic_name: topics.topic_name,
      subject_id: subjects.subject_id,
      subject_name: subjects.subject_name,
      mastery_level: topic_mastery.mastery_level,
      accuracy_percentage: topic_mastery.accuracy_percentage,
      questions_attempted: topic_mastery.questions_attempted,
      last_practiced: topic_mastery.last_practiced,
    })
    .from(topics)
    .leftJoin(topic_mastery, 
      eq(topics.topic_id, topic_mastery.topic_id) && eq(topic_mastery.user_id, userId)
    )
    .innerJoin(subjects, eq(topics.subject_id, subjects.subject_id))
    .orderBy(desc(topic_mastery.last_practiced));

    // For topics that the user hasn't started yet, set default values
    const processedData = masteryData.map(topic => ({
      ...topic,
      mastery_level: topic.mastery_level || 'notStarted',
      accuracy_percentage: topic.accuracy_percentage || 0,
      questions_attempted: topic.questions_attempted || 0,
      last_practiced: topic.last_practiced || null
    }));

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching topic mastery:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

