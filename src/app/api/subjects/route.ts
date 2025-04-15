import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/subjects - Get all active subjects
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const isActive = searchParams.get('isActive') === 'true' ? true : undefined;
    
    // Execute query with filters if provided
    let allSubjects;
    if (isActive !== undefined) {
      allSubjects = await db.select().from(subjects).where(eq(subjects.is_active, isActive));
    } else {
      allSubjects = await db.select().from(subjects);
    }
    
    return NextResponse.json({
      success: true,
      data: allSubjects
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subjects'
    }, { status: 500 });
  }
}