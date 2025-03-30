// src/app/api/admin/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllQuestions, 
  getQuestionById,
  getQuestionsByTopic,
  getQuestionsBySubtopic,
  createQuestion,
  updateQuestion,
  deleteQuestion 
} from '@/db/admin-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const topicId = url.searchParams.get('topicId');
    const subtopicId = url.searchParams.get('subtopicId');
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 100;
    const offset = url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : 0;
    
    if (id) {
      const question = await getQuestionById(Number(id));
      
      if (!question || question.length === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      
      return NextResponse.json(question[0]);
    }
    
    if (topicId) {
      const questions = await getQuestionsByTopic(Number(topicId));
      return NextResponse.json(questions);
    }
    
    if (subtopicId) {
      const questions = await getQuestionsBySubtopic(Number(subtopicId));
      return NextResponse.json(questions);
    }
    
    const questions = await getAllQuestions(limit, offset);
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.question_text || !data.question_type) {
      return NextResponse.json(
        { error: 'Question text and type are required' }, 
        { status: 400 }
      );
    }
    
    const newQuestion = await createQuestion(data);
    
    return NextResponse.json(newQuestion[0], { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.question_id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    const updated = await updateQuestion(data.question_id, data);
    
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    await deleteQuestion(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}