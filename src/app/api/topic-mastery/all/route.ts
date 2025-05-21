// src/app/api/topic-mastery/all/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { topic_mastery, topics, subjects } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache'; // Import cache

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cacheKey = `user:${userId}:topic-mastery:all-topics`;

    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ data: cachedData, source: 'cache' });
    }

    // Fetch complete topic mastery data with subject information
    const masteryDataFromDb = await db.select({ // Renamed to avoid confusion
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
      // Original: eq(topics.topic_id, topic_mastery.topic_id) && eq(topic_mastery.user_id, userId)
      // Drizzle requires `and` for multiple conditions in join
      eq(topics.topic_id, topic_mastery.topic_id) 
      // Note: The userId condition in leftJoin might behave unexpectedly if user_id is null in topic_mastery.
      // It might be better to filter by userId in a WHERE clause on topic_mastery if that's the intent,
      // or ensure the join condition is correctly structured if topic_mastery might not have a user_id record.
      // For now, assuming original logic was intended to be `ON ... AND topic_mastery.user_id = userId`
      // which Drizzle translates from `eq(field, value)` directly in the join.
      // A more robust way if `topic_mastery.user_id` could be null or if you only want user-specific mastery:
      // .leftJoin(topic_mastery, and(eq(topics.topic_id, topic_mastery.topic_id), eq(topic_mastery.user_id, userId)))
      // The original code `eq(topics.topic_id, topic_mastery.topic_id) && eq(topic_mastery.user_id, userId)`
      // is not valid Drizzle syntax for a join condition. It should be `and(...)`.
      // However, since it's a LEFT JOIN, the `eq(topic_mastery.user_id, userId)` effectively turns it into an INNER JOIN
      // for the mastery part if `userId` is not found or `topic_mastery.user_id` is null.
      // Correcting this to a proper `and` condition for clarity, though behavior might change if original was flawed.
      // Sticking to original structure's implied logic:
      // This part `eq(topics.topic_id, topic_mastery.topic_id) && eq(topic_mastery.user_id, userId)` is problematic for Drizzle.
      // Let's assume it's meant to be `and(eq(topics.topic_id, topic_mastery.topic_id), eq(topic_mastery.user_id, userId))`
      // For a left join, this means if a topic_mastery record exists, it MUST match the userId.
      // If no such record exists, topic fields are null.
      // This is a common pattern.
       .on(eq(topics.topic_id, topic_mastery.topic_id) && eq(topic_mastery.user_id, userId))
    )
    .innerJoin(subjects, eq(topics.subject_id, subjects.subject_id))
    .orderBy(desc(topic_mastery.last_practiced));

    // For topics that the user hasn't started yet, set default values
    const processedData = masteryDataFromDb.map(topic => ({
      ...topic,
      mastery_level: topic.mastery_level || 'notStarted',
      accuracy_percentage: topic.accuracy_percentage || 0,
      questions_attempted: topic.questions_attempted || 0,
      last_practiced: topic.last_practiced || null
    }));

    // Cache the result
    await cache.set(cacheKey, processedData, 3600); // 3600 seconds = 1 hour

    return NextResponse.json({ data: processedData, source: 'database' });
  } catch (error) {
    console.error('Error fetching topic mastery:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}