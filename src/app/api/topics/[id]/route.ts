// src/app/api/topics/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics, subtopics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cache } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the topic ID from params
    const topicId = Number((await params).id);
    if (Number.isNaN(topicId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid topic ID' 
      }, { status: 400 });
    }

    // Define cache key for this topic with its related subtopics
    const cacheKey = `api:topics/${topicId}`;
    
    // Try to get data from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        source: 'cache'
      }, { status: 200 });
    }
    
    // Cache miss - execute database queries
    // Get topic details
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.topic_id, topicId));

    if (!topic) {
      return NextResponse.json({ 
        success: false, 
        error: 'Topic not found' 
      }, { status: 404 });
    }

    // Get subtopics for this topic
    const relatedSubtopics = await db
      .select()
      .from(subtopics)
      .where(eq(subtopics.topic_id, topicId))
      .orderBy(subtopics.subtopic_name);
    
    // Prepare response data
    const responseData = {
      success: true,
      topic,
      subtopics: relatedSubtopics
    };
    
    // Store in cache - topics with subtopics can be cached for longer
    // since this hierarchical data changes less frequently
    await cache.set(cacheKey, responseData, 7200); // Cache for 2 hours
    
    return NextResponse.json({
      ...responseData,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching topic details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch topic details'
    }, { status: 500 });
  }
}
