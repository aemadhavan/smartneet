// src/app/api/topic-mastery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topic_mastery, topics } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache'; // Import cache

// Get topic mastery data for a user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subjectIdParam = searchParams.get('subjectId');
    const subjectId = subjectIdParam ? parseInt(subjectIdParam) : undefined;

    const cacheKey = `user:${userId}:topic-mastery:subject:${subjectId || 'all'}`;

    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ data: cachedData, source: 'cache' });
    }
    
    // Create base query
    const baseQuery = db
      .select({
        mastery_id: topic_mastery.mastery_id,
        user_id: topic_mastery.user_id,
        topic_id: topic_mastery.topic_id,
        topic_name: topics.topic_name,
        mastery_level: topic_mastery.mastery_level,
        questions_attempted: topic_mastery.questions_attempted,
        questions_correct: topic_mastery.questions_correct,
        accuracy_percentage: topic_mastery.accuracy_percentage,
        last_practiced: topic_mastery.last_practiced,
        streak_count: topic_mastery.streak_count,
        subject_id: topics.subject_id
      })
      .from(topic_mastery)
      .innerJoin(topics, eq(topic_mastery.topic_id, topics.topic_id));
    
    // Create conditions array
    const conditions = [eq(topic_mastery.user_id, userId)];
    
    // Add subject filter if provided
    if (subjectId) {
      conditions.push(eq(topics.subject_id, subjectId));
    }
    
    // Execute query with all conditions and ordering
    const masteryDataFromDb = await baseQuery // Renamed to avoid confusion
      .where(and(...conditions))
      .orderBy(desc(topic_mastery.last_practiced));
    
    // Cache the result
    await cache.set(cacheKey, masteryDataFromDb, 3600); // 3600 seconds = 1 hour

    return NextResponse.json({ data: masteryDataFromDb, source: 'database' });
  } catch (error) {
    console.error('Error fetching topic mastery data:', error);
    return NextResponse.json({ error: 'Failed to fetch topic mastery data' }, { status: 500 });
  }
}
