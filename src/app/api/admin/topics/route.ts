// src/app/api/admin/topics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllTopics, 
  getTopicById, 
  getTopicsBySubject,
  createTopic, 
  updateTopic, 
  deleteTopic 
} from '@/db/admin-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const subjectId = url.searchParams.get('subjectId');
    const subject_id = url.searchParams.get('subject_id'); // Add support for subject_id parameter
    
    if (id) {
      const topic = await getTopicById(Number(id));
      
      if (!topic || topic.length === 0) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
      }
      
      return NextResponse.json(topic[0]);
    }
    
    // Check for either subjectId or subject_id parameter
    const effectiveSubjectId = subjectId || subject_id;
    
    if (effectiveSubjectId) {
      const topics = await getTopicsBySubject(Number(effectiveSubjectId));
      return NextResponse.json(topics);
    }
    
    const topics = await getAllTopics();
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.subject_id || !data.topic_name) {
      return NextResponse.json(
        { error: 'Subject ID and topic name are required' }, 
        { status: 400 }
      );
    }
    
    const newTopic = await createTopic({
      subject_id: data.subject_id,
      topic_name: data.topic_name,
      parent_topic_id: data.parent_topic_id || null,
      description: data.description
    });
    
    return NextResponse.json(newTopic[0], { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.topic_id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }
    
    const updateData: {
      topic_name?: string;
      parent_topic_id?: number | null;
      description?: string;
      is_active?: boolean;
    } = {};
    
    if (data.topic_name) updateData.topic_name = data.topic_name;
    if (data.parent_topic_id !== undefined) updateData.parent_topic_id = data.parent_topic_id;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    
    const updated = await updateTopic(data.topic_id, updateData);
    
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }
    
    await deleteTopic(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}
