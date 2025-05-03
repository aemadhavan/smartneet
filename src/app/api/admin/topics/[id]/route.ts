// src/app/api/admin/topics/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withCache } from '@/lib/cache';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise to get the id
  const { id } = await params;
  const topicId = parseInt(id);
  
  // Generate a cache key
  const cacheKey = `topic:${topicId}:details`;
  
  try {
    // Try to get from cache first
    const result = await withCache(
      async () => {
        const topicData = await db.select()
          .from(topics)
          .where(eq(topics.topic_id, topicId))
          .limit(1);
        
        if (topicData.length === 0) {
          return null;
        }
        
        return topicData[0];
      },
      cacheKey,
      3600 // 1 hour cache
    )();
    
    if (!result) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}