// src/lib/services/QuestionPoolService.ts
import { db } from '@/db';
import { topics } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { CACHE_TTLS } from '@/lib/middleware/rateLimitMiddleware';
import { SUBJECT_IDS } from '@/lib/constants/subscription';
import { improvedSubscriptionService } from './ImprovedSubscriptionService';

// Define question interfaces
export interface QuestionWithDetails {
  question_id: number;
  question_text: string;
  question_type: "MultipleChoice" | "Matching" | "MultipleCorrectStatements" | "AssertionReason" | "DiagramBased" | "SequenceOrdering";
  details: unknown;
  explanation: string | null;
  difficulty_level: string | null;
  marks: number;
  negative_marks: number;
  topic_id: number;
  topic_name: string;
  subtopic_id: number | null;
  subtopic_name: string | null;
  source_type: string;
}

export class QuestionPoolService {
  /**
   * Fetch free topics for a subject
   * @param subjectId Subject ID
   * @param limit Number of free topics to fetch
   */
  async getFreemiumTopics(subjectId: number, limit: number = 2): Promise<{ topic_id: number }[]> {
    try {
      const freemiumTopics = await db
        .select({ topic_id: topics.topic_id })
        .from(topics)
        .where(
          and(
            eq(topics.subject_id, subjectId),
            eq(topics.is_active, true),
            isNull(topics.parent_topic_id)
          )
        )
        .orderBy(topics.topic_id)
        .limit(limit);
      
      return freemiumTopics;
    } catch (error) {
      logger.error('Error fetching freemium topics', {
        context: 'QuestionPoolService.getFreemiumTopics',
        data: { subjectId, limit },
        error: error instanceof Error ? error : String(error)
      });
      return [];
    }
  }
  
  
  /**
   * Fetch all potential questions matching the given filters using relational query syntax
   */
  async fetchPotentialQuestions(
    subjectId: number, 
    topicId?: number, 
    subtopicId?: number
  ): Promise<QuestionWithDetails[]> {
    try {
      const queryResults = await db.query.questions.findMany({
        where: (questions, { and, eq }) => and(
          eq(questions.subject_id, subjectId),
          eq(questions.source_type, 'AI_Generated'),
          eq(questions.is_active, true),
          ...(topicId ? [eq(questions.topic_id, topicId)] : []),
          ...(subtopicId ? [eq(questions.subtopic_id, subtopicId)] : [])
        ),
        with: {
          topic: {
            columns: {
              topic_id: true,
              topic_name: true
            }
          },
          subtopic: {
            columns: {
              subtopic_id: true,
              subtopic_name: true
            }
          }
        }
      });
      
      // Transform results to match QuestionWithDetails interface
      return queryResults.map(q => ({
        question_id: q.question_id,
        question_text: q.question_text,
        question_type: q.question_type,
        details: q.details,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level,
        marks: q.marks ?? 0,
        negative_marks: q.negative_marks ?? 0,
        topic_id: q.topic?.topic_id ?? 0,
        topic_name: q.topic?.topic_name ?? '',
        subtopic_id: q.subtopic?.subtopic_id ?? null,
        subtopic_name: q.subtopic?.subtopic_name ?? null,
        source_type: q.source_type
      }));
    } catch (error) {
      logger.error('Error fetching potential questions', {
        context: 'QuestionPoolService.fetchPotentialQuestions',
        data: { subjectId, topicId, subtopicId },
        error: error instanceof Error ? error : String(error)
      });
      return [];
    }
  }
  
  /**
   * Filter questions for freemium users
   */
  async filterFreemiumQuestions(
    questions: QuestionWithDetails[],
    subjectId: number
  ): Promise<QuestionWithDetails[]> {
    try {
      const freemiumTopics = await this.getFreemiumTopics(subjectId);
      const freemiumTopicIds = new Set(freemiumTopics.map(t => t.topic_id));
      
      return questions.filter(q => freemiumTopicIds.has(q.topic_id));
    } catch (error) {
      logger.error('Error filtering freemium questions', {
        context: 'QuestionPoolService.filterFreemiumQuestions',
        data: { subjectId },
        error: error instanceof Error ? error : String(error)
      });
      return questions; // Return all questions on error
    }
  }
  
  /**
   * Get personalized questions for a user
   */
  async getPersonalizedQuestions(
    userId: string,
    subjectId: number,
    topicId?: number,
    subtopicId?: number,
    questionCount: number = 10
  ): Promise<QuestionWithDetails[]> {
    try {
      // Check if this is a Botany subject (Biology)
      const isBotanySubject = subjectId === SUBJECT_IDS.BIOLOGY;
      
      // Check if user has premium subscription
      const isPremiumUser = await improvedSubscriptionService.isUserPremium(userId);
      const isFreemiumUser = !isPremiumUser;
      
      // Cache key for the potential questions pool
      const poolCacheKey = `questions:pool:subject:${subjectId}:topic:${topicId}:subtopic:${subtopicId}:source:AI_Generated`;
      
      // Try to get the potential questions pool from cache
      let potentialQuestions = await cache.get<QuestionWithDetails[]>(poolCacheKey);
      
      if (!potentialQuestions) {
        // Cache miss - execute query to get potential questions
        potentialQuestions = await this.fetchPotentialQuestions(subjectId, topicId, subtopicId);
        
        // Cache the potential questions pool for future use
        await cache.set(poolCacheKey, potentialQuestions, CACHE_TTLS.QUESTION_POOL);
        
        logger.info('Question pool cache miss', {
          userId,
          context: 'QuestionPoolService.getPersonalizedQuestions',
          data: { subjectId, topicId, subtopicId, cacheKey: poolCacheKey }
        });
      } else {
        logger.debug('Question pool cache hit', {
          userId,
          context: 'QuestionPoolService.getPersonalizedQuestions',
          data: { subjectId, topicId, subtopicId, cacheKey: poolCacheKey }
        });
      }
      
      // For free users practicing botany without a specific topic,
      // filter to only include first two topics
      if (isBotanySubject && isFreemiumUser && !topicId && potentialQuestions) {
        potentialQuestions = await this.filterFreemiumQuestions(potentialQuestions, subjectId);
      }
      
      // Make sure potentialQuestions is an array before spreading
      const questionsArray = Array.isArray(potentialQuestions) ? potentialQuestions : [];
      
      // Shuffle questions and take the requested number
      const shuffled = [...questionsArray].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, questionCount);
      
      logger.info('Selected personalized questions', {
        userId,
        context: 'QuestionPoolService.getPersonalizedQuestions',
        data: { 
          subjectId, 
          questionCount: selectedQuestions.length,
          availableCount: questionsArray.length
        }
      });
      
      return selectedQuestions;
    } catch (error) {
      logger.error('Error getting personalized questions', {
        context: 'QuestionPoolService.getPersonalizedQuestions',
        data: { userId, subjectId, topicId, subtopicId, questionCount },
        error: error instanceof Error ? error : String(error)
      });
      throw new Error(`Failed to get questions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export a singleton instance
export const questionPoolService = new QuestionPoolService();