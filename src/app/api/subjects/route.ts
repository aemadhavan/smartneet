//File: src/app/api/subjects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry } from '@/db';
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
    const cachedData = await cache.get(cacheKey).catch(() => null);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        source: 'cache' // Optional: helps with debugging
      }, { status: 200 });
    }
    
    // Cache miss - execute query with filters if provided using centralized retry logic
    const allSubjects = await withRetry(async () => {
      if (isActive !== undefined) {
        return await db.select().from(subjects).where(eq(subjects.is_active, isActive));
      } else {
        return await db.select().from(subjects);
      }
    });
    
    // Store result in cache (using appropriate TTL based on data type)
    await cache.set(cacheKey, allSubjects, 3600).catch(() => {
      // If cache set fails, log but don't break the response
      console.warn('Failed to cache subjects data');
    }); // Cache for 1 hour
    
    // Return the data from database
    return NextResponse.json({
      success: true,
      data: allSubjects,
      source: 'database' // Optional: helps with debugging
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    
    // Try to return cached data as fallback, even if expired
    const cacheKey = `api:subjects:isActive:${req.nextUrl.searchParams.get('isActive')}`;
    const fallbackData = await cache.get(cacheKey).catch(() => null);
    
    if (fallbackData) {
      console.log('Returning stale cache data as fallback');
      return NextResponse.json({
        success: true,
        data: fallbackData,
        source: 'fallback_cache',
        warning: 'Data may be stale due to connection issues'
      }, { status: 200 });
    }
    
    // If no cache available, return minimal fallback
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      data: [], // Return empty array as fallback
      fallback: true
    }, { status: 503 }); // 503 Service Unavailable instead of 500
  }
}