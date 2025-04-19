// lib/services/SubjectService.ts
import { db } from '@/db'
import { subjects, topics, subtopics } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { cache, withCache, Cached } from '../cache'

export class SubjectService {
  /**
   * Get all active subjects
   */
  @Cached('subjects', 3600) // Cache for 1 hour
  async getAllSubjects() {
    return db.select().from(subjects).where(eq(subjects.is_active, true))
  }

  /**
   * Get a subject by ID
   */
  async getSubjectById(id: number) {
    const cacheKey = `subject:${id}`
    
    // Try to get from cache first
    const cachedSubject = await cache.get(cacheKey)
    if (cachedSubject) {
      return cachedSubject
    }
    
    // If not in cache, fetch from database
    const result = await db.select().from(subjects).where(eq(subjects.subject_id, id))
    const subject = result[0] || null
    
    // Cache the result (only if found)
    if (subject) {
      await cache.set(cacheKey, subject)
    }
    
    return subject
  }
  
  /**
   * Get all topics for a subject
   */
  async getSubjectTopics(subjectId: number) {
    return withCache(
      async (id: number) => {
        return db.select().from(topics).where(eq(topics.subject_id, id))
      },
      `subject:${subjectId}:topics`
    )(subjectId)
  }
  
  /**
   * Invalidate subject cache when data changes
   */
  async invalidateSubjectCache(subjectId: number) {
    await cache.delete(`subject:${subjectId}`)
    await cache.delete(`subject:${subjectId}:topics`)
    // Could also consider invalidating related subtopics cache
  }
}