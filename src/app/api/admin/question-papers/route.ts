// src/app/api/admin/question-papers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllQuestionPapers,
  getQuestionPaperById,
  createQuestionPaper,
  updateQuestionPaper,
  deleteQuestionPaper,
  countQuestionsByPaperId
} from '@/db/admin-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const paper = await getQuestionPaperById(Number(id));
      
      if (!paper || paper.length === 0) {
        return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
      }
      
      return NextResponse.json(paper[0]);
    }
    
    const papers = await getAllQuestionPapers();
    return NextResponse.json(papers);
  } catch (error) {
    console.error('Error fetching question papers:', error);
    return NextResponse.json({ error: 'Failed to fetch question papers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.paper_year || !data.subject) {
      return NextResponse.json(
        { error: 'Paper year and subject are required' }, 
        { status: 400 }
      );
    }
    
    const newPaper = await createQuestionPaper({
      paper_year: data.paper_year,
      paper_code: data.paper_code,
      subject: data.subject,
      section: data.section,
      total_questions: data.total_questions,
      max_marks: data.max_marks,
      time_duration_minutes: data.time_duration_minutes,
      source: data.source
    });
    
    return NextResponse.json(newPaper[0], { status: 201 });
  } catch (error) {
    console.error('Error creating question paper:', error);
    return NextResponse.json({ error: 'Failed to create question paper' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.paper_id) {
      return NextResponse.json({ error: 'Paper ID is required' }, { status: 400 });
    }
    
    const updateData: {
      paper_year?: number;
      paper_code?: string | null;
      subject?: string;
      section?: string | null;
      total_questions?: number | null;
      max_marks?: number | null;
      time_duration_minutes?: number | null;
      source?: string | null;
    } = {};
    
    if (data.paper_year !== undefined) updateData.paper_year = data.paper_year;
    if (data.paper_code !== undefined) updateData.paper_code = data.paper_code;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.section !== undefined) updateData.section = data.section;
    if (data.total_questions !== undefined) updateData.total_questions = data.total_questions;
    if (data.max_marks !== undefined) updateData.max_marks = data.max_marks;
    if (data.time_duration_minutes !== undefined) updateData.time_duration_minutes = data.time_duration_minutes;
    if (data.source !== undefined) updateData.source = data.source;
    
    const updated = await updateQuestionPaper(data.paper_id, updateData);
    
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating question paper:', error);
    return NextResponse.json({ error: 'Failed to update question paper' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Paper ID is required' }, { status: 400 });
    }
    
    // Check if paper has questions associated
    const questionsCount = await countQuestionsByPaperId(Number(id));
    
    if (questionsCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete question paper with associated questions' 
      }, { status: 400 });
    }
    
    await deleteQuestionPaper(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question paper:', error);
    return NextResponse.json({ error: 'Failed to delete question paper' }, { status: 500 });
  }
}