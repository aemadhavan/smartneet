// src/app/api/questions/[questionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  questions, 
  topics, 
  subtopics, 
  subjects 
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Safely access params with proper error handling
    const questionIdString = (await params).questionId;
    if (!questionIdString) {
      return NextResponse.json({ error: 'Missing question ID' }, { status: 400 });
    }

    const questionId = parseInt(questionIdString);
    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    // Create a cache key for this specific question
    const cacheKey = `question:${questionId}`;
    
    // Try to get from cache first
    const cachedQuestion = await cache.get(cacheKey);
    if (cachedQuestion) {
      return NextResponse.json({
        ...cachedQuestion,
        source: 'cache'
      });
    }

    // Cache miss - fetch from database
    const question = await db.select({
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
      subject_id: questions.subject_id,
      topic_id: questions.topic_id,
      subtopic_id: questions.subtopic_id,
      topic_name: topics.topic_name,
      subtopic_name: subtopics.subtopic_name,
      subject_name: subjects.subject_name
    })
    .from(questions)
    .leftJoin(topics, eq(questions.topic_id, topics.topic_id))
    .leftJoin(subtopics, eq(questions.subtopic_id, subtopics.subtopic_id))
    .leftJoin(subjects, eq(questions.subject_id, subjects.subject_id))
    .where(and(
      eq(questions.question_id, questionId),
      eq(questions.is_active, true)
    ))
    .limit(1);

    if (!question || question.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Cache the result for future requests (1 hour TTL)
    await cache.set(cacheKey, question[0], 3600);
    
    return NextResponse.json({
      ...question[0],
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Failed to fetch question details' }, { status: 500 });
  }
}
