// src/app/api/subjects/by-name/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { ilike } from 'drizzle-orm';
import { cache } from '@/lib/cache'; // Import cache

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

    const cacheKey = `subject:by-name:${name.toLowerCase()}`;

    // Try to get from cache first
    const cachedSubject = await cache.get(cacheKey);
    if (cachedSubject) {
      return NextResponse.json({
        success: true,
        data: cachedSubject,
        source: 'cache'
      });
    }
    
    let dataFromDb = null;
    const source = 'database';

    // Look for subject by name (case-insensitive)
    const foundSubjects = await db
      .select()
      .from(subjects)
      .where(ilike(subjects.subject_name, name))
      .limit(1);
    
    if (foundSubjects.length > 0) {
      dataFromDb = foundSubjects[0];
    } else {
      // If not found by name, try by code
      const foundByCode = await db
        .select()
        .from(subjects)
        .where(ilike(subjects.subject_code, name))
        .limit(1);
      
      if (foundByCode.length > 0) {
        dataFromDb = foundByCode[0];
      }
    }
    
    if (!dataFromDb) {
      return NextResponse.json({
        success: false, 
        error: 'Subject not found'
      }, { status: 404 });
    }

    // Cache the result
    await cache.set(cacheKey, dataFromDb, 7200); // 7200 seconds = 2 hours
    
    return NextResponse.json({
      success: true,
      data: dataFromDb,
      source: source
    });
  } catch (error) {
    console.error('Error finding subject by name:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to find subject'
    }, { status: 500 });
  }
}
