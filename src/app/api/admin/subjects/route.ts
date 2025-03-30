// src/app/api/admin/subjects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllSubjects, 
  getSubjectById, 
  createSubject, 
  updateSubject, 
  deleteSubject 
} from '@/db/admin-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const subject = await getSubjectById(Number(id));
      
      if (!subject || subject.length === 0) {
        return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
      }
      
      return NextResponse.json(subject[0]);
    }
    
    const subjects = await getAllSubjects();
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.subject_name || !data.subject_code) {
      return NextResponse.json(
        { error: 'Subject name and code are required' }, 
        { status: 400 }
      );
    }
    
    const newSubject = await createSubject({
      subject_name: data.subject_name,
      subject_code: data.subject_code
    });
    
    return NextResponse.json(newSubject[0], { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.subject_id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }
    
    const updateData: {
      subject_name?: string;
      subject_code?: string;
      is_active?: boolean;
    } = {};
    
    if (data.subject_name) updateData.subject_name = data.subject_name;
    if (data.subject_code) updateData.subject_code = data.subject_code;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    
    const updated = await updateSubject(data.subject_id, updateData);
    
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }
    
    await deleteSubject(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}