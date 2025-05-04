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
   * Invalidate caches for a user's subscription
   */
  static async invalidateUserSubscription(userId: string) {
    // Invalidate basic subscription data
    await cache.delete(`user:${userId}:subscription`);
    await cache.delete(`user:${userId}:subscription:details`);
    
    // Invalidate API cache
    await cache.delete(`api:user:${userId}:subscription`);
    
    // Invalidate test usage counters
    await cache.delete(`user:${userId}:tests:today`);
    
    // Invalidate payment history
    await cache.delete(`user:${userId}:payments`);
    
    // Revalidate relevant paths
    revalidatePath(`/dashboard/subscription`);
    revalidatePath(`/api/user/subscription`);
    revalidatePath(`/api/user/${userId}/subscription`);
    
    // Revalidate tags
    revalidateTag(`user-${userId}-subscription`);
    revalidateTag(`subscription`);
  }
  
  /**
   * Invalidate all subscription plans cache
   */
  static async invalidateSubscriptionPlans() {
    await cache.delete('subscription:active-plans');
    await cache.delete('api:subscription-plans:all');
    
    // Revalidate paths
    revalidatePath('/pricing');
    revalidatePath('/api/subscription-plans');
    
    // Revalidate tags
    revalidateTag('subscription-plans');
  }
  
  /**
   * Invalidate user's practice session caches
   */
  static async invalidateUserSessionCaches(userId: string) {
    // Delete the main cache key for sessions list
    await cache.delete(`api:practice-sessions:user:${userId}`);
    
    // Delete common pagination variants
    await cache.delete(`api:practice-sessions:user:${userId}:limit:10:offset:0`);
    await cache.delete(`api:practice-sessions:user:${userId}:limit:10:offset:0`);
    
    // Invalidate recent sessions for dashboard
    await cache.delete(`user:${userId}:recent-sessions`);
    
    // Revalidate paths
    revalidatePath(`/dashboard`);
    revalidatePath(`/practice`);
    revalidatePath(`/sessions`);
    revalidatePath(`/api/practice-sessions`);
    
    // Revalidate tags
    revalidateTag(`user-${userId}-sessions`);
    revalidateTag(`user-sessions`);
  }
  
  /**
   * Invalidate payment-related caches
   */
  static async invalidatePaymentCaches(userId: string) {
    await cache.delete(`user:${userId}:payments`);
    await cache.delete(`api:user:${userId}:payment-history`);
    
    // Revalidate paths
    revalidatePath(`/dashboard/billing`);
    revalidatePath(`/api/user/payment-history`);
    
    // Revalidate tags
    revalidateTag(`user-${userId}-payments`);
    revalidateTag(`payments`);
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
  
  /**
   * Invalidate test limit caches when limits change
   */
  static async invalidateTestLimits() {
    // This would be called when plan limits are changed globally
    await cache.delete('subscription:limits');
    
    // Revalidate paths
    revalidatePath('/pricing');
    revalidatePath('/dashboard/subscription');
    
    // Revalidate tags
    revalidateTag('subscription-limits');
  }
}