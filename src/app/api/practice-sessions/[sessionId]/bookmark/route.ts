// src/app/api/practice-sessions/[sessionId]/bookmark/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session_questions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

// Schema for validating bookmark update request
const bookmarkSchema = z.object({
  session_question_id: z.number(),
  is_bookmarked: z.boolean()
});

// Update bookmark status for a session question
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = parseInt(params.sessionId);
    const requestData = await request.json();
    const validatedData = bookmarkSchema.parse(requestData);

    // Update bookmark status
    const [updatedQuestion] = await db
      .update(session_questions)
      .set({
        is_bookmarked: validatedData.is_bookmarked,
        updated_at: new Date()
      })
      .where(
        and(
          eq(session_questions.session_id, sessionId),
          eq(session_questions.session_question_id, validatedData.session_question_id)
        )
      )
      .returning();

    if (!updatedQuestion) {
      return NextResponse.json({ error: 'Session question not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      is_bookmarked: updatedQuestion.is_bookmarked
    });
  } catch (error) {
    console.error('Error updating bookmark status:', error);
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.errors : 'Failed to update bookmark status' },
      { status: 400 }
    );
  }
}