// lib/cacheInvalidation.ts
import { cache } from './cache'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Cache invalidation helper with both server and API caches
 */
export class CacheInvalidator {
  /**
   * Invalidate caches for a specific subject
   */
  static async invalidateSubject(subjectId: number) {
    // Invalidate Redis/memory cache
    await cache.delete(`subject:${subjectId}`)
    await cache.delete(`subject:${subjectId}:topics`)
    await cache.delete(`api:subject:${subjectId}:true`)
    await cache.delete(`api:subject:${subjectId}:false`)
    
    // Invalidate Next.js cache
    revalidatePath(`/subjects/${subjectId}`)
    revalidatePath(`/api/subjects/${subjectId}`)
    revalidateTag(`subject-${subjectId}`)
  }
  
  /**
   * Invalidate caches for a specific topic
   */
  static async invalidateTopic(topicId: number, subjectId?: number) {
    // Invalidate Redis/memory cache
    await cache.delete(`topic:${topicId}:withSubtopics`)
    await cache.delete(`topic:${topicId}:questions`)
    
    // Invalidate related API caches
    // Use pattern deletion if your Redis client supports it
    // Otherwise, you need to enumerate all possible cache keys
    
    // Invalidate Next.js cache
    revalidatePath(`/topics/${topicId}`)
    revalidatePath(`/api/topics/${topicId}`)
    revalidateTag(`topic-${topicId}`)
    
    // If subject ID is provided, also invalidate that subject's topic list
    if (subjectId) {
      await cache.delete(`subject:${subjectId}:topics`)
      revalidateTag(`subject-${subjectId}-topics`)
    }
  }
  
  /**
   * Invalidate caches for a specific subtopic
   */
  static async invalidateSubtopic(subtopicId: number, topicId?: number) {
    // Invalidate Redis/memory cache
    await cache.delete(`subtopic:${subtopicId}:questions`)
    
    // Invalidate Next.js cache
    revalidatePath(`/subtopics/${subtopicId}`)
    revalidatePath(`/api/subtopics/${subtopicId}`)
    revalidateTag(`subtopic-${subtopicId}`)
    
    // If topic ID is provided, also invalidate the topic's subtopics list
    if (topicId) {
      await cache.delete(`topic:${topicId}:withSubtopics`)
      revalidateTag(`topic-${topicId}-subtopics`)
    }
  }
  
  /**
   * Invalidate caches for a specific question
   */
  static async invalidateQuestion(questionId: number, topicId?: number, subtopicId?: number) {
    // Invalidate Redis/memory cache
    await cache.delete(`question:${questionId}:details`)
    
    // Invalidate Next.js cache
    revalidatePath(`/questions/${questionId}`)
    revalidatePath(`/api/questions/${questionId}`)
    revalidateTag(`question-${questionId}`)
    
    // If topic or subtopic IDs are provided, also invalidate related caches
    if (topicId) {
      await cache.delete(`topic:${topicId}:questions`)
      revalidateTag(`topic-${topicId}-questions`)
    }
    
    if (subtopicId) {
      await cache.delete(`subtopic:${subtopicId}:questions`)
      revalidateTag(`subtopic-${subtopicId}-questions`)
    }
  }
  
  /**
   * Invalidate all questions for a topic
   */
  static async invalidateTopicQuestions(topicId: number) {
    await cache.delete(`topic:${topicId}:questions`)
    revalidateTag(`topic-${topicId}-questions`)
  }
  
  /**
   * Invalidate all questions for a subtopic
   */
  static async invalidateSubtopicQuestions(subtopicId: number) {
    await cache.delete(`subtopic:${subtopicId}:questions`)
    revalidateTag(`subtopic-${subtopicId}-questions`)
  }
}