// File: src/app/api/topics/with-subtopic-counts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics, subtopics } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { cache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId');
    const isRootLevel = searchParams.get('isRootLevel') === 'true';
    const isActive = searchParams.get('isActive') === 'true' ? true : undefined;
    
    // Create cache key based on parameters
    const cacheKey = `api:topics:with-counts:subjectId:${subjectId}:isRootLevel:${isRootLevel}:isActive:${isActive}`;
    
    // Try to get from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        source: 'cache'
      });
    }
    
    // Build conditions array first
    const conditions = [];
    
    if (subjectId) {
      conditions.push(eq(topics.subject_id, parseInt(subjectId)));
    }
    
    if (isRootLevel) {
      conditions.push(isNull(topics.parent_topic_id));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(topics.is_active, isActive));
    }
    
    // Execute the query with all conditions
    const query = db.select({
      topic_id: topics.topic_id,
      subject_id: topics.subject_id,
      topic_name: topics.topic_name,
      parent_topic_id: topics.parent_topic_id,
      description: topics.description,
      is_active: topics.is_active,
      created_at: topics.created_at,
      updated_at: topics.updated_at,
      subtopicsCount: sql`count(${subtopics.subtopic_id})`.as('subtopics_count')
    })
    .from(topics)
    .leftJoin(subtopics, eq(topics.topic_id, subtopics.topic_id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(
      topics.topic_id,
      topics.subject_id,
      topics.topic_name,
      topics.parent_topic_id,
      topics.description,
      topics.is_active,
      topics.created_at,
      topics.updated_at
    );
    
    // Execute the query
    const results = await query;
    
    // Cache the results
    await cache.set(cacheKey, results, 3600); // 1 hour cache
    
    return NextResponse.json({
      success: true,
      data: results,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching topics with counts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch topics with subtopic counts'
    }, { status: 500 });
  }
}