// src/app/api/topic-mastery/all/route.ts
import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import { db } from '@/db';
import { topic_mastery, topics, subjects } from '@/db';
import { eq, desc, and } from 'drizzle-orm'; // Import and
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache'; // Import cache

export async function GET(request: NextRequest) { // Add request parameter
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Read subjectId query parameter
    const searchParams = request.nextUrl.searchParams;
    const subjectIdParam = searchParams.get('subjectId');
    const subjectId = subjectIdParam ? parseInt(subjectIdParam) : undefined;

    // Update cache key
    const cacheKey = `user:${userId}:topic-mastery:all-topics:subject:${subjectId || 'all'}`;

    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ data: cachedData, source: 'cache' });
    }

    // Base query
    let query = db.select({
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
      and( // Corrected join condition
        eq(topics.topic_id, topic_mastery.topic_id), 
        eq(topic_mastery.user_id, userId)
      )
    )
    .innerJoin(subjects, eq(topics.subject_id, subjects.subject_id));

    // Apply subjectId filter if provided
    const conditions = [];
    if (subjectId !== undefined) { // Check if subjectId is defined (could be 0)
      conditions.push(eq(topics.subject_id, subjectId));
    }

    if (conditions.length > 0) {
      // query.where(and(...conditions)); // This syntax is for update/delete, select uses it directly
      // For select, apply where directly if conditions exist.
      // Drizzle's select query builder needs the where clause chained.
      // So, we build the query instance and then conditionally add .where()
      // This can't be done by re-assigning `query = query.where(...)` if query is not `any` type.
      // A common pattern is to build conditions array and then pass to where.
      // However, Drizzle's select expects `where` to be chained directly.
      // The simplest way is to build the query and then execute it.
      // Let's adjust the query building slightly.
    }

    // If there are conditions, apply them. Otherwise, fetch all.
    const finalQuery = conditions.length > 0 ? query.where(and(...conditions)) : query;
    
    const masteryDataFromDb = await finalQuery.orderBy(desc(topic_mastery.last_practiced));

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