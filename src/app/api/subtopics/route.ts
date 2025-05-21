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

// POST /api/subtopics - Create a new subtopic
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const createSubtopicSchema = z.object({
  topic_id: z.number({ required_error: "Topic ID is required" }).int().positive(),
  subtopic_name: z.string({ required_error: "Subtopic name is required" }).min(1, "Subtopic name cannot be empty").max(255),
  subtopic_description: z.string().optional(),
  is_active: z.boolean().optional().default(true), // Default to true if not provided
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = createSubtopicSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: "Invalid input",
        details: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const validatedData = validationResult.data;

    // Database insertion using validatedData
    const newSubtopic = await db.insert(subtopics).values({
      topic_id: validatedData.topic_id,
      subtopic_name: validatedData.subtopic_name,
      subtopic_description: validatedData.subtopic_description,
      is_active: validatedData.is_active,
      // created_by: userId, // Assuming you have a created_by field
      // updated_by: userId, // Assuming you have an updated_by field
    }).returning(); // .returning() to get the inserted record, if needed

    if (!newSubtopic || newSubtopic.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create subtopic in database'
      }, { status: 500 });
    }
    
    // Use the utility function to invalidate caches
    // Pass the newly created subtopic_id if invalidateSubtopicCaches can use it
    await invalidateSubtopicCaches(newSubtopic[0]?.subtopic_id, validatedData.topic_id); 
    
    return NextResponse.json({
      success: true,
      message: 'Subtopic created successfully',
      data: newSubtopic[0] // Return the created subtopic
    }, { status: 201 });
  } catch (error) {
    // Log the detailed error for server-side inspection
    console.error('Error creating subtopic:', error instanceof Error ? error.message : String(error));
    // Return a generic error message to the client
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while creating the subtopic.'
    }, { status: 500 });
  }
}

// Utility function to help with cache invalidation for subtopics
async function invalidateSubtopicCaches(subtopicId?: number, topicId?: number) {
  if (subtopicId) {
    await cache.delete(`subtopic:${subtopicId}`);
  }
  
  if (topicId) {
    // Invalidate topic-specific subtopics list
    await cache.delete(`api:subtopics:topicId:${topicId}:subjectId:undefined:isActive:undefined`);
    await cache.delete(`api:subtopics:topicId:${topicId}:subjectId:undefined:isActive:true`);
    await cache.delete(`api:subtopics:topicId:${topicId}:subjectId:undefined:isActive:false`);
    
    // Get subject_id for this topic
    const topicResult = await db.select({ subject_id: topics.subject_id })
      .from(topics)
      .where(eq(topics.topic_id, topicId));
    
    if (topicResult.length > 0 && topicResult[0].subject_id) {
      const subjectId = topicResult[0].subject_id;
      
      // Invalidate subject-specific subtopics list
      await cache.delete(`api:subtopics:topicId:undefined:subjectId:${subjectId}:isActive:undefined`);
      await cache.delete(`api:subtopics:topicId:undefined:subjectId:${subjectId}:isActive:true`);
      await cache.delete(`api:subtopics:topicId:undefined:subjectId:${subjectId}:isActive:false`);
    }
  }
  
  // Also invalidate the general subtopics list
  await cache.delete(`api:subtopics:topicId:undefined:subjectId:undefined:isActive:undefined`);
  await cache.delete(`api:subtopics:topicId:undefined:subjectId:undefined:isActive:true`);
  await cache.delete(`api:subtopics:topicId:undefined:subjectId:undefined:isActive:false`);
}