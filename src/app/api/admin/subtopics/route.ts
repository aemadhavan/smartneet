// src/app/api/admin/subtopics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllSubtopics, 
  getSubtopicById, 
  getSubtopicsByTopic,
  createSubtopic, 
  updateSubtopic, 
  deleteSubtopic 
} from '@/db/admin-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const topicId = url.searchParams.get('topicId');
    
    if (id) {
      const subtopic = await getSubtopicById(Number(id));
      
      if (!subtopic || subtopic.length === 0) {
        return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });
      }
      
      return NextResponse.json(subtopic[0]);
    }
    
    if (topicId) {
      const subtopics = await getSubtopicsByTopic(Number(topicId));
      return NextResponse.json(subtopics);
    }
    
    const subtopics = await getAllSubtopics();
    return NextResponse.json(subtopics);
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    return NextResponse.json({ error: 'Failed to fetch subtopics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.topic_id || !data.subtopic_name) {
      return NextResponse.json(
        { error: 'Topic ID and subtopic name are required' }, 
        { status: 400 }
      );
    }
    
    const newSubtopic = await createSubtopic({
      topic_id: data.topic_id,
      subtopic_name: data.subtopic_name,
      description: data.description
    });
    
    return NextResponse.json(newSubtopic[0], { status: 201 });
  } catch (error) {
    console.error('Error creating subtopic:', error);
    return NextResponse.json({ error: 'Failed to create subtopic' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.subtopic_id) {
      return NextResponse.json({ error: 'Subtopic ID is required' }, { status: 400 });
    }
    
    const updateData: {
      topic_id?: number;
      subtopic_name?: string;
      description?: string;
      is_active?: boolean;
    } = {};
    
    if (data.topic_id !== undefined) updateData.topic_id = data.topic_id;
    if (data.subtopic_name) updateData.subtopic_name = data.subtopic_name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    
    const updated = await updateSubtopic(data.subtopic_id, updateData);
    
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating subtopic:', error);
    return NextResponse.json({ error: 'Failed to update subtopic' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Subtopic ID is required' }, { status: 400 });
    }
    
    await deleteSubtopic(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subtopic:', error);
    return NextResponse.json({ error: 'Failed to delete subtopic' }, { status: 500 });
  }
}