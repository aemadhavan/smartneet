import { db } from '@/db'
import { subtopics, topics } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { cache, withCache, Cached } from '../cache'

export class SubtopicService {
  /**
   * Get all active subtopics 
   */
  @Cached('subtopics', 3600) // Cache for 1 hour
  async getAllSubtopics() {
    return db.select().from(subtopics).where(eq(subtopics.is_active, true))
  }

  /**
   * Get subtopics by topic ID
   */
  async getSubtopicsByTopic(topicId: number) {
    return withCache(
      async (id: number) => {
        return db.select().from(subtopics)
          .where(and(
            eq(subtopics.topic_id, id),
            eq(subtopics.is_active, true)
          ))
      },
      `topic:${topicId}:subtopics`,
      1800 // Cache for 30 minutes
    )(topicId)
  }

  /**
   * Get subtopics by subject ID (requires joining with topics)
   */
  async getSubtopicsBySubject(subjectId: number) {
    return withCache(
      async (id: number) => {
        // First get all topic IDs for this subject
        const subjectTopics = await db.select({ topic_id: topics.topic_id })
          .from(topics)
          .where(and(
            eq(topics.subject_id, id),
            eq(topics.is_active, true)
          ))
        
        // Extract topic IDs
        const topicIds = subjectTopics.map(t => t.topic_id)
        
        if (topicIds.length === 0) {
          return []
        }
        
        // Now get all subtopics for these topics
        return db.select().from(subtopics)
          .where(and(
            inArray(subtopics.topic_id, topicIds),
            eq(subtopics.is_active, true)
          ))
      },
      `subject:${subjectId}:subtopics`,
      1800 // Cache for 30 minutes
    )(subjectId)
  }

  /**
   * Get a subtopic by ID
   */
  async getSubtopicById(id: number) {
    const cacheKey = `subtopic:${id}`
    
    // Try to get from cache first
    const cachedSubtopic = await cache.get(cacheKey)
    if (cachedSubtopic) {
      return cachedSubtopic
    }
    
    // If not in cache, fetch from database
    const result = await db.select().from(subtopics).where(eq(subtopics.subtopic_id, id))
    const subtopic = result[0] || null
    
    // Cache the result (only if found)
    if (subtopic) {
      await cache.set(cacheKey, subtopic, 3600) // Cache for 1 hour
    }
    
    return subtopic
  }

  
  /**
   * Invalidate subtopic cache when data changes
   */
  async invalidateSubtopicCache(subtopicId: number, topicId?: number) {
    await cache.delete(`subtopic:${subtopicId}`)
    
    if (topicId) {
      await cache.delete(`topic:${topicId}:subtopics`)
      // Could also consider invalidating related topic cache
    }
  }
}