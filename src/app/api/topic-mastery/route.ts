// src/app/api/topic-mastery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topic_mastery, topics } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

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
    const masteryData = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(topic_mastery.last_practiced));
    
    return NextResponse.json(masteryData);
  } catch (error) {
    console.error('Error fetching topic mastery data:', error);
    return NextResponse.json({ error: 'Failed to fetch topic mastery data' }, { status: 500 });
  }
}
