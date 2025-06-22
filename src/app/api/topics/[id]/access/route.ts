// src/app/api/topics/[id]/access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { cache } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const topicId = Number((await params).id);
    if (Number.isNaN(topicId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid topic ID' 
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const isPremium = searchParams.get('isPremium') === 'true';
    const limitParam = searchParams.get('limitParam');

    // Define cache key for this access check
    const cacheKey = `api:topics/${topicId}/access:${isPremium}:${limitParam || 'none'}`;
    
    // Try to get data from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        source: 'cache'
      }, { status: 200 });
    }

    // Create database operation with timeout protection
    const dbOperation = async () => {
      // Get topic details including subject information
      const [topic] = await db
        .select({
          topic_id: topics.topic_id,
          subject_id: topics.subject_id,
          topic_name: topics.topic_name,
        })
        .from(topics)
        .where(eq(topics.topic_id, topicId));

      if (!topic) {
        return null;
      }

      // Get all root-level active topics for this subject to determine the topic's position
      // This matches the original logic: isRootLevel=true&isActive=true
      const allTopics = await db
        .select({
          topic_id: topics.topic_id,
        })
        .from(topics)
        .where(
          and(
            eq(topics.subject_id, topic.subject_id),
            eq(topics.is_active, true),
            isNull(topics.parent_topic_id) // This represents root-level topics
          )
        )
        .orderBy(topics.topic_id);

      return { topic, allTopics };
    };

    // Add timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database operation timeout'));
      }, 5000);
    });

    const result = await Promise.race([dbOperation(), timeoutPromise]);

    if (!result) {
      return NextResponse.json({ 
        success: false, 
        error: 'Topic not found' 
      }, { status: 404 });
    }

    const { topic, allTopics } = result;

    // Find the index of the current topic (0-based)
    const topicIndex = allTopics.findIndex(t => t.topic_id === topicId);

    // Business logic for access control
    let hasAccess = true;

    // If topic is not found in the root-level active topics, deny access for non-premium users
    if (topicIndex === -1 && !isPremium) {
      hasAccess = false;
    }
    // If user is not premium and limitParam is not 'free'
    else if (!isPremium && limitParam !== 'free') {
      // Only allow access to the first two topics (index 0 and 1)
      if (topicIndex > 1) {
        hasAccess = false;
      }
    }

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        hasAccess,
        topicIndex,
        isPremiumRequired: !hasAccess,
        topic: {
          id: topic.topic_id,
          name: topic.topic_name,
          subject_id: topic.subject_id
        }
      }
    };

    // Store in cache - access checks can be cached for a moderate time
    // since topic access rules don't change frequently
    await cache.set(cacheKey, responseData, 1800); // Cache for 30 minutes

    return NextResponse.json({
      ...responseData,
      source: 'database'
    });
  } catch (error) {
    console.error('Error checking topic access:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check topic access'
    }, { status: 500 });
  }
}