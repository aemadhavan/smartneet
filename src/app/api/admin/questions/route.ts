// src/app/api/admin/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllQuestions, 
  getQuestionById,
  getQuestionsByTopic,
  getQuestionsBySubtopic,
  getQuestionsByPaperId,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  updateQuestionPaperCount
} from '@/db/admin-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const topicId = url.searchParams.get('topicId');
    const subtopicId = url.searchParams.get('subtopicId');
    const paperId = url.searchParams.get('paperId');
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 100;
    const offset = url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : 0;
    
    if (id) {
      const question = await getQuestionById(Number(id));
      
      if (!question || question.length === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      
      return NextResponse.json(question[0]);
    }
    
    if (paperId) {
      const questions = await getQuestionsByPaperId(Number(paperId));
      return NextResponse.json(questions);
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
    
    // If this is associated with a paper, update the paper's question count
    if (data.paper_id) {
      await updateQuestionPaperCount(data.paper_id);
    }
    
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
    
    const question = await getQuestionById(data.question_id);
    if (!question || question.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    const oldPaperId = question[0].paper_id;
    const newPaperId = data.paper_id;
    
    const updated = await updateQuestion(data.question_id, data);
    
    // If paper ID changed, update question counts for both papers
    if (oldPaperId !== newPaperId) {
      if (oldPaperId) {
        await updateQuestionPaperCount(oldPaperId);
      }
      if (newPaperId) {
        await updateQuestionPaperCount(newPaperId);
      }
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
    
    // Get the question to check if it's associated with a paper
    const question = await getQuestionById(Number(id));
    if (!question || question.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    const paperId = question[0].paper_id;
    
    await deleteQuestion(Number(id));
    
    // If the question was associated with a paper, update the paper's question count
    if (paperId) {
      await updateQuestionPaperCount(paperId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}