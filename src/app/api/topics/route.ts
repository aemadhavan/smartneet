// app/api/topics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry } from '@/db';
import { topics } from '@/db/schema';
import { eq, isNull, and, SQL, sql } from 'drizzle-orm';
import { cache } from '@/lib/cache';

// GET /api/topics - Get topics with optional filtering
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId') ? parseInt(searchParams.get('subjectId')!) : undefined;
    const parentTopicId = searchParams.get('parentTopicId') ? parseInt(searchParams.get('parentTopicId')!) : undefined;
    const isRootLevel = searchParams.get('isRootLevel') === 'true' ? true : undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true :
                    searchParams.get('isActive') === 'false' ? false :
                    undefined;
    const includeSubtopicCount = searchParams.get('includeSubtopicCount') === 'true';

    // Create a cache key based on all query parameters
    const cacheKey = `api:topics:subjectId:${subjectId}:parentTopicId:${parentTopicId}:isRootLevel:${isRootLevel}:isActive:${isActive}:includeSubtopicCount:${includeSubtopicCount}`;

    // Try to get data from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        source: 'cache'
      }, { status: 200 });
    }

    // Cache miss - proceed with database query
    // Build conditions array with proper typing
    const conditions: SQL<unknown>[] = [];

    if (subjectId) {
      conditions.push(eq(topics.subject_id, subjectId));
    }

    if (parentTopicId) {
      conditions.push(eq(topics.parent_topic_id, parentTopicId));
    }

    if (isRootLevel) {
      conditions.push(isNull(topics.parent_topic_id));
    }

    if (isActive !== undefined) {
      conditions.push(eq(topics.is_active, isActive));
    }

    let topicsResult;

    // Execute query with conditions - with retry for database connectivity
    if (includeSubtopicCount) {
      // Optimized query with LEFT JOIN to get subtopic counts in one query
      topicsResult = await withRetry(async () => {
        const query = db
          .select({
            topic_id: topics.topic_id,
            subject_id: topics.subject_id,
            topic_name: topics.topic_name,
            parent_topic_id: topics.parent_topic_id,
            description: topics.description,
            is_active: topics.is_active,
            created_at: topics.created_at,
            updated_at: topics.updated_at,
            subtopicsCount: sql<number>`CAST(COUNT(${sql.identifier('subtopics', 'topic_id')}) AS INTEGER)`,
          })
          .from(topics)
          .leftJoin(
            sql`${topics} as subtopics`,
            sql`${sql.identifier('subtopics', 'parent_topic_id')} = ${topics.topic_id} AND ${sql.identifier('subtopics', 'is_active')} = true`
          )
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .groupBy(topics.topic_id);

        return await query;
      });
    } else {
      // Original query without subtopic counts
      topicsResult = await withRetry(async () => {
        if (conditions.length > 0) {
          return await db.select().from(topics).where(and(...conditions));
        } else {
          return await db.select().from(topics);
        }
      });
    }

    // Store result in cache - use different TTLs based on the query type
    // Subject and parent filtering is more stable, so cache longer
    let cacheTTL = 3600; // Default 1 hour

    if (subjectId || parentTopicId) {
      cacheTTL = 7200; // 2 hours for hierarchical data that changes less frequently
    }

    await cache.set(cacheKey, topicsResult, cacheTTL).catch(() => {
      // If cache set fails, log but don't break the response
      console.warn('Failed to cache topics data');
    });

    return NextResponse.json({
      success: true,
      data: topicsResult,
      source: 'database'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch topics'
    }, { status: 500 });
  }
}