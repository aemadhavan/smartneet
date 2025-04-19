// lib/services/QuestionService.ts
import { db } from '@/db'
import { questions, topics, subtopics } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { cache, withCache } from '../cache'

export class QuestionService {
  /**
   * Get questions by topic with caching
   */
  async getQuestionsByTopic(topicId: number) {
    return withCache(
      async (id: number) => {
        return db.select().from(questions).where(eq(questions.topic_id, id))
      },
      `topic:${topicId}:questions`,
      1800 // Cache for 30 minutes
    )(topicId)
  }

  /**
   * Get questions by subtopic with caching
   */
  async getQuestionsBySubtopic(subtopicId: number) {
    return withCache(
      async (id: number) => {
        return db.select().from(questions).where(eq(questions.subtopic_id, id))
      },
      `subtopic:${subtopicId}:questions`,
      1800 // Cache for 30 minutes
    )(subtopicId)
  }
  
  /**
   * Get question by ID with full details
   */
  async getQuestionWithDetails(questionId: number) {
    const cacheKey = `question:${questionId}:details`
    
    // Try cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    // Get question with joins to topic and subtopic information
    const result = await db
      .select({
        question: questions,
        topic: {
          topic_id: topics.topic_id,
          topic_name: topics.topic_name
        },
        subtopic: {
          subtopic_id: subtopics.subtopic_id,
          subtopic_name: subtopics.subtopic_name
        }
      })
      .from(questions)
      .leftJoin(topics, eq(questions.topic_id, topics.topic_id))
      .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
      .where(eq(questions.question_id, questionId))
    
    const question = result[0] || null
    
    // Cache the result (only if found)
    if (question) {
      await cache.set(cacheKey, question, 3600) // Cache for 1 hour
    }
    
    return question
  }
  
  /**
   * Invalidate question cache when data changes
   */
  async invalidateQuestionCache(questionId: number) {
    await cache.delete(`question:${questionId}:details`)
  }
}