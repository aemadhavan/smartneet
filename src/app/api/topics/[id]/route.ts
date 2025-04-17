// src/app/api/topics/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { topics, subtopics } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Safe access to params
    const topicId = Number((await params).id);
    if (isNaN(topicId)) {
      return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 });
    }

    // Get topic details
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.topic_id, topicId));

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Get subtopics for this topic
    const relatedSubtopics = await db
      .select()
      .from(subtopics)
      .where(eq(subtopics.topic_id, topicId))
      .orderBy(subtopics.subtopic_name);

    return NextResponse.json({
      success: true,
      topic,
      subtopics: relatedSubtopics
    });
  } catch (error) {
    console.error('Error fetching topic details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch topic details'
    }, { status: 500 });
  }
}
