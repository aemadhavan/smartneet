// src/app/api/admin/subtopics/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subtopics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withCache } from '@/lib/cache';

// Updated type definition for Next.js 15
// The params object is now a Promise that must be awaited
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise to get the id
  const { id } = await params;
  const subtopicId = parseInt(id);
  
  // Generate a cache key
  const cacheKey = `subtopic:${subtopicId}:details`;
  
  try {
    // Try to get from cache first
    const result = await withCache(
      async () => {
        const subtopicData = await db.select()
          .from(subtopics)
          .where(eq(subtopics.subtopic_id, subtopicId))
          .limit(1);
        
        if (subtopicData.length === 0) {
          return null;
        }
        
        return subtopicData[0];
      },
      cacheKey,
      3600 // 1 hour cache
    )();
    
    if (!result) {
      return NextResponse.json(
        { error: 'Subtopic not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching subtopic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtopic' },
      { status: 500 }
    );
  }
}