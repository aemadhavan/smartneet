// app/api/practice-sessions/[sessionId]/bookmark/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session_questions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { cache } from '@/lib/cache'; // Import cache

// Schema for validating bookmark update request
const bookmarkSchema = z.object({
  session_question_id: z.number(),
  is_bookmarked: z.boolean(),
});

// Configure dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Route handler for Next.js 15.2.4
export async function POST(request: NextRequest) {
  try {
    // Get the session ID from the URL
    const pathname = request.nextUrl.pathname;
    const match = pathname.match(/\/practice-sessions\/(\d+)\/bookmark/);
    const sessionId = match ? parseInt(match[1], 10) : NaN;
    
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const requestData = await request.json();
    const validatedData = bookmarkSchema.parse(requestData);

    // Update bookmark status
    const [updatedQuestion] = await db
      .update(session_questions)
      .set({
        is_bookmarked: validatedData.is_bookmarked,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(session_questions.session_id, sessionId),
          eq(session_questions.session_question_id, validatedData.session_question_id),
          eq(session_questions.user_id, userId)
        )
      )
      .returning();

    if (!updatedQuestion) {
      return NextResponse.json({ error: 'Session question not found' }, { status: 404 });
    }

    // Invalidate active session cache
    try {
      const activeSessionCacheKey = `session:${userId}:${sessionId}:active`;
      await cache.delete(activeSessionCacheKey);
      console.log(`Cache invalidated for active session after bookmark update: ${activeSessionCacheKey}`);
    } catch (cacheError) {
      console.error('Error during active session cache invalidation after bookmark update:', cacheError);
      // Non-critical, so don't fail the request, but log it.
    }

    return NextResponse.json({
      success: true,
      is_bookmarked: updatedQuestion.is_bookmarked,
    });
  } catch (error) {
    console.error('Error updating bookmark status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update bookmark status' },
      { status: 500 }
    );
  }
}