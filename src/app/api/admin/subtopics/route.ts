// src/app/api/admin/subtopics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SubtopicService } from '@/lib/services/SubtopicService';

const subtopicService = new SubtopicService();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const topicId = url.searchParams.get('topicId');
    const subjectId = url.searchParams.get('subject_id'); // Support for subject_id parameter
    
    if (id) {
      const subtopic = await subtopicService.getSubtopicById(Number(id));
      
      if (!subtopic) {
        return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });
      }
      
      return NextResponse.json(subtopic);
    }
    
    if (topicId) {
      const subtopics = await subtopicService.getSubtopicsByTopic(Number(topicId));
      return NextResponse.json(subtopics);
    }
    
    if (subjectId) {
      const subtopics = await subtopicService.getSubtopicsBySubject(Number(subjectId));
      return NextResponse.json(subtopics);
    }
    
    const subtopics = await subtopicService.getAllSubtopics();
    return NextResponse.json(subtopics);
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    return NextResponse.json({ error: 'Failed to fetch subtopics' }, { status: 500 });
  }
}

// Keep the existing POST, PUT, and DELETE methods as they are
// or refactor them to use the service if desired