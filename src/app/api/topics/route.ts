// app/api/topics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
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
    
    // Create a cache key based on all query parameters
    const cacheKey = `api:topics:subjectId:${subjectId}:parentTopicId:${parentTopicId}:isRootLevel:${isRootLevel}:isActive:${isActive}`;
    
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
    // Build conditions array
    const conditions = [];
    
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
    
    // Execute query with conditions
    let topicsResult;
    if (conditions.length > 0) {
      topicsResult = await db.select().from(topics).where(and(...conditions));
    } else {
      topicsResult = await db.select().from(topics);
    }
    
    // Store result in cache - use different TTLs based on the query type
    // Subject and parent filtering is more stable, so cache longer
    let cacheTTL = 3600; // Default 1 hour
    
    if (subjectId || parentTopicId) {
      cacheTTL = 7200; // 2 hours for hierarchical data that changes less frequently
    }
    
    await cache.set(cacheKey, topicsResult, cacheTTL);
    
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