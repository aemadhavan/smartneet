//File: src/app/api/subjects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cache } from '@/lib/cache';

// GET /api/subjects - Get all active subjects
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const isActive = searchParams.get('isActive') === 'true' ? true : 
                     searchParams.get('isActive') === 'false' ? false : 
                     undefined;
    
    // Create a cache key based on the query parameters
    const cacheKey = `api:subjects:isActive:${isActive}`;
    
    // Try to get data from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        source: 'cache' // Optional: helps with debugging
      }, { status: 200 });
    }
    
    // Cache miss - execute query with filters if provided
    let allSubjects;
    if (isActive !== undefined) {
      allSubjects = await db.select().from(subjects).where(eq(subjects.is_active, isActive));
    } else {
      allSubjects = await db.select().from(subjects);
    }
    
    // Store result in cache (using appropriate TTL based on data type)
    await cache.set(cacheKey, allSubjects, 3600); // Cache for 1 hour
    
    // Return the data from database
    return NextResponse.json({
      success: true,
      data: allSubjects,
      source: 'database' // Optional: helps with debugging
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subjects'
    }, { status: 500 });
  }
}