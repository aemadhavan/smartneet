// Example API endpoint for querying chemistry questions
// This can be used as a reference for creating your own API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { db } from './src/db/index';
import { subjects, questions, topics, subtopics } from './src/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';

// Example function to get chemistry questions
export async function getChemistryQuestions(params: {
  limit?: number;
  topic_id?: number;
  subtopic_id?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  question_type?: string;
}) {
  const { limit = 10, topic_id, subtopic_id, difficulty, question_type } = params;
  
  try {
    // Get chemistry subject ID (assuming subject_id=2 for chemistry)
    const CHEMISTRY_SUBJECT_ID = 2;
    
    // Build query conditions
    const conditions = [
      eq(questions.subject_id, CHEMISTRY_SUBJECT_ID),
      eq(questions.is_active, true)
    ];
    
    if (topic_id) {
      conditions.push(eq(questions.topic_id, topic_id));
    }
    
    if (subtopic_id) {
      conditions.push(eq(questions.subtopic_id, subtopic_id));
    }
    
    if (difficulty) {
      conditions.push(eq(questions.difficulty_level, difficulty));
    }
    
    if (question_type) {
      conditions.push(eq(questions.question_type, question_type));
    }
    
    // Query questions with related data
    const result = await db
      .select({
        question_id: questions.question_id,
        question_text: questions.question_text,
        question_type: questions.question_type,
        details: questions.details,
        explanation: questions.explanation,
        difficulty_level: questions.difficulty_level,
        marks: questions.marks,
        negative_marks: questions.negative_marks,
        is_image_based: questions.is_image_based,
        image_url: questions.image_url,
        topic_name: topics.topic_name,
        subtopic_name: subtopics.subtopic_name,
        subject_name: subjects.subject_name
      })
      .from(questions)
      .leftJoin(topics, eq(questions.topic_id, topics.topic_id))
      .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
      .leftJoin(subjects, eq(questions.subject_id, subjects.subject_id))
      .where(and(...conditions))
      .limit(limit);
    
    return result;
    
  } catch (error) {
    console.error('Error querying chemistry questions:', error);
    throw error;
  }
}

// Example function to get chemistry topics and subtopics
export async function getChemistryTopics() {
  const CHEMISTRY_SUBJECT_ID = 2;
  
  try {
    const result = await db
      .select({
        topic_id: topics.topic_id,
        topic_name: topics.topic_name,
        subtopics: sql<any>`
          COALESCE(
            json_agg(
              json_build_object(
                'subtopic_id', ${subtopics.subtopic_id},
                'subtopic_name', ${subtopics.subtopic_name}
              )
            ) FILTER (WHERE ${subtopics.subtopic_id} IS NOT NULL),
            '[]'
          )
        `
      })
      .from(topics)
      .leftJoin(subtopics, eq(topics.topic_id, subtopics.topic_id))
      .where(and(
        eq(topics.subject_id, CHEMISTRY_SUBJECT_ID),
        eq(topics.is_active, true)
      ))
      .groupBy(topics.topic_id, topics.topic_name)
      .orderBy(topics.topic_name);
    
    return result;
    
  } catch (error) {
    console.error('Error querying chemistry topics:', error);
    throw error;
  }
}

// Example function to get question statistics
export async function getChemistryQuestionStats() {
  const CHEMISTRY_SUBJECT_ID = 2;
  
  try {
    const stats = await db
      .select({
        total_questions: count(questions.question_id),
        difficulty_breakdown: sql<any>`
          json_build_object(
            'easy', COUNT(CASE WHEN ${questions.difficulty_level} = 'easy' THEN 1 END),
            'medium', COUNT(CASE WHEN ${questions.difficulty_level} = 'medium' THEN 1 END),
            'hard', COUNT(CASE WHEN ${questions.difficulty_level} = 'hard' THEN 1 END)
          )
        `,
        type_breakdown: sql<any>`
          json_object_agg(
            ${questions.question_type}, 
            COUNT(${questions.question_id})
          )
        `
      })
      .from(questions)
      .where(and(
        eq(questions.subject_id, CHEMISTRY_SUBJECT_ID),
        eq(questions.is_active, true)
      ));
    
    return stats[0];
    
  } catch (error) {
    console.error('Error querying chemistry question stats:', error);
    throw error;
  }
}

// Example Next.js API handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '10');
    const topic_id = searchParams.get('topic_id') ? parseInt(searchParams.get('topic_id')!) : undefined;
    const subtopic_id = searchParams.get('subtopic_id') ? parseInt(searchParams.get('subtopic_id')!) : undefined;
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | undefined;
    const question_type = searchParams.get('question_type') || undefined;
    
    // Get questions
    const questions = await getChemistryQuestions({
      limit,
      topic_id,
      subtopic_id,
      difficulty,
      question_type
    });
    
    // Get topics if requested
    const includeTopics = searchParams.get('include_topics') === 'true';
    const topics = includeTopics ? await getChemistryTopics() : null;
    
    // Get stats if requested
    const includeStats = searchParams.get('include_stats') === 'true';
    const stats = includeStats ? await getChemistryQuestionStats() : null;
    
    return NextResponse.json({
      success: true,
      data: {
        questions,
        topics,
        stats,
        count: questions.length
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chemistry questions'
    }, { status: 500 });
  }
}

// Example usage in a React component or another service
export async function exampleUsage() {
  // Get 5 chemistry questions
  const questions = await getChemistryQuestions({ limit: 5 });
  
  // Get medium difficulty questions from a specific topic
  const mediumQuestions = await getChemistryQuestions({
    limit: 10,
    topic_id: 5,
    difficulty: 'medium'
  });
  
  // Get all chemistry topics with their subtopics
  const topics = await getChemistryTopics();
  
  // Get question statistics
  const stats = await getChemistryQuestionStats();
  
  return {
    questions,
    mediumQuestions,
    topics,
    stats
  };
}