// app/api/subtopics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subtopics, topics } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { cache } from '@/lib/cache';

// GET /api/subtopics - Get subtopics with optional filtering
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const topicId = searchParams.get('topicId') ? parseInt(searchParams.get('topicId')!) : undefined;
    const subjectId = searchParams.get('subjectId') ? parseInt(searchParams.get('subjectId')!) : undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : 
                     searchParams.get('isActive') === 'false' ? false : 
                     undefined;
    
    // Create a cache key based on all query parameters
    const cacheKey = `api:subtopics:topicId:${topicId}:subjectId:${subjectId}:isActive:${isActive}`;
    
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
    // Handle subject-based filtering first if needed
    let relevantTopicIds: number[] | undefined;
    if (subjectId) {
      // Check if we have the topics for this subject in cache
      const subjectTopicsCacheKey = `subject:${subjectId}:topicIds`;
      const cachedTopicIds = await cache.get<number[]>(subjectTopicsCacheKey);
      
      if (cachedTopicIds) {
        relevantTopicIds = cachedTopicIds;
      } else {
        // Not in cache, query the database
        const topicsForSubject = await db.select({ topic_id: topics.topic_id })
          .from(topics)
          .where(eq(topics.subject_id, subjectId));
        
        relevantTopicIds = topicsForSubject.map(t => t.topic_id);
        
        // Cache the topic IDs for this subject
        await cache.set(subjectTopicsCacheKey, relevantTopicIds, 3600); // Cache for 1 hour
      }
      
      // If no topics found for this subject, return empty result
      if (relevantTopicIds.length === 0) {
        // Cache the empty result too
        await cache.set(cacheKey, [], 3600);
        
        return NextResponse.json({
          success: true,
          data: [],
          source: 'database'
        }, { status: 200 });
      }
    }
    
    // Build conditions
    const conditions = [];
    
    if (topicId) {
      conditions.push(eq(subtopics.topic_id, topicId));
    } else if (relevantTopicIds && relevantTopicIds.length > 0) {
      // If filtering by subject, use the topic IDs we found
      conditions.push(inArray(subtopics.topic_id, relevantTopicIds));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(subtopics.is_active, isActive));
    }
    
    // Execute query
    let subtopicsResult;
    if (conditions.length > 0) {
      subtopicsResult = await db.select().from(subtopics).where(and(...conditions));
    } else {
      subtopicsResult = await db.select().from(subtopics);
    }
    
    // Cache the result
    await cache.set(cacheKey, subtopicsResult, 1800); // Cache for 30 minutes
    
    return NextResponse.json({
      success: true,
      data: subtopicsResult,
      source: 'database'
    }, { status: 200 });
  } catch (error) {
    // Log the detailed error for server-side inspection
    console.error('Error fetching subtopics:', error instanceof Error ? error.message : String(error));
    // Return a generic error message to the client
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching subtopics.'
    }, { status: 500 });
  }
}

