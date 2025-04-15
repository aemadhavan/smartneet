import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subtopics, topics } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// GET /api/subtopics - Get subtopics with optional filtering
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const topicId = searchParams.get('topicId') ? parseInt(searchParams.get('topicId')!) : undefined;
    const subjectId = searchParams.get('subjectId') ? parseInt(searchParams.get('subjectId')!) : undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : undefined;
    
    // Handle subject-based filtering first if needed
    let relevantTopicIds: number[] | undefined;
    if (subjectId) {
      const topicsForSubject = await db.select({ topic_id: topics.topic_id })
        .from(topics)
        .where(eq(topics.subject_id, subjectId));
      
      relevantTopicIds = topicsForSubject.map(t => t.topic_id);
      
      // If no topics found for this subject, return empty result
      if (relevantTopicIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: []
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
    
    return NextResponse.json({
      success: true,
      data: subtopicsResult
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subtopics'
    }, { status: 500 });
  }
}