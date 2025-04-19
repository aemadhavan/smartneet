// lib/services/TopicService.ts
import { db } from '@/db'
import { topics, subtopics } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { cache, withCache, Cached } from '../cache'

export class TopicService {
  /**
   * Get active topics with optional filtering by parent
   */
  @Cached('topics', 3600)
  async getTopics(subjectId?: number, parentTopicId?: number | null) {
    let query = db.select().from(topics);
    let conditions = [eq(topics.is_active, true)];
    
    if (subjectId !== undefined) {
      conditions.push(eq(topics.subject_id, subjectId));
    }
    
    if (parentTopicId !== undefined) {
      if (parentTopicId === null) {
        // Get root topics (no parent)
        conditions.push(isNull(topics.parent_topic_id));
      } else {
        // Get child topics of specific parent
        conditions.push(eq(topics.parent_topic_id, parentTopicId));
      }
    }
    
    return query.where(and(...conditions));
  }

  /**
   * Get a topic by ID with its subtopics
   */
  async getTopicWithSubtopics(topicId: number) {
    const cacheKey = `topic:${topicId}:withSubtopics`
    
    // Try cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    // Get topic
    const topicResult = await db.select().from(topics).where(eq(topics.topic_id, topicId))
    const topic = topicResult[0]
    
    if (!topic) {
      return null
    }
    
    // Get subtopics
    const subtopicsList = await db.select().from(subtopics).where(eq(subtopics.topic_id, topicId))
    
    const result = {
      ...topic,
      subtopics: subtopicsList
    }
    
    // Cache the result
    await cache.set(cacheKey, result)
    
    return result
  }
  
  /**
   * Invalidate topic cache when data changes
   */
  async invalidateTopicCache(topicId: number) {
    await cache.delete(`topic:${topicId}:withSubtopics`)
    // Consider invalidating parent caches as well
  }
}