import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

// GET /api/topics - Get topics with optional filtering
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId') ? parseInt(searchParams.get('subjectId')!) : undefined;
    const parentTopicId = searchParams.get('parentTopicId') ? parseInt(searchParams.get('parentTopicId')!) : undefined;
    const isRootLevel = searchParams.get('isRootLevel') === 'true' ? true : undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : undefined;
    
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
    
    return NextResponse.json({
      success: true,
      data: topicsResult
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch topics'
    }, { status: 500 });
  }
}