//File: src/app/api/subjects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cache } from '@/lib/cache';

// Retry logic for database operations
async function retryDbOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Database operation attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait longer between retries
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

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
    
    // Cache miss - execute query with filters if provided using retry logic
    const allSubjects = await retryDbOperation(async () => {
      if (isActive !== undefined) {
        return await db.select().from(subjects).where(eq(subjects.is_active, isActive));
      } else {
        return await db.select().from(subjects);
      }
    });
    
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