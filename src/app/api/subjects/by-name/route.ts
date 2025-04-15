// src/app/api/subjects/by-name/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { ilike } from 'drizzle-orm';

// GET /api/subjects/by-name?name=botany - Get a subject by name
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({
        success: false, 
        error: 'Subject name is required'
      }, { status: 400 });
    }
    
    // Look for subject by name (case-insensitive)
    const foundSubjects = await db
      .select()
      .from(subjects)
      .where(ilike(subjects.subject_name, name))
      .limit(1);
    
    // If not found by name, try by code
    if (foundSubjects.length === 0) {
      const foundByCode = await db
        .select()
        .from(subjects)
        .where(ilike(subjects.subject_code, name))
        .limit(1);
      
      if (foundByCode.length === 0) {
        return NextResponse.json({
          success: false, 
          error: 'Subject not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: foundByCode[0]
      });
    }
    
    return NextResponse.json({
      success: true,
      data: foundSubjects[0]
    });
  } catch (error) {
    console.error('Error finding subject by name:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to find subject'
    }, { status: 500 });
  }
}
