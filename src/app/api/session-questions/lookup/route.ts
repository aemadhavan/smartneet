// src/app/api/session-questions/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session_questions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

// Schema for validating lookup request
const lookupSchema = z.object({
  session_id: z.preprocess(
    (val) => parseInt(String(val), 10), // Ensure val is string before parseInt
    z.number({ invalid_type_error: "session_id must be a number" }).int().positive()
  ),
  question_id: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number({ invalid_type_error: "question_id must be a number" }).int().positive()
  ),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get data from URL query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionIdParam = searchParams.get('session_id');
    const questionIdParam = searchParams.get('question_id');

    // Validate the data
    const validationResult = lookupSchema.safeParse({
      session_id: sessionIdParam,
      question_id: questionIdParam,
    });

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const validatedData = validationResult.data;
      
    // Look up the session question
    const [sessionQuestion] = await db
      .select({
        session_question_id: session_questions.session_question_id
      })
      .from(session_questions)
      .where(
        and(
          eq(session_questions.session_id, validatedData.session_id),
          eq(session_questions.question_id, validatedData.question_id),
          // Ensure the lookup is also scoped to the authenticated user for security
          eq(session_questions.user_id, userId) 
        )
      );

    if (!sessionQuestion) {
      return NextResponse.json({ 
        error: 'Session question not found for this user' 
      }, { status: 404 });
    }

    // Return the session_question_id
    return NextResponse.json({
      session_question_id: sessionQuestion.session_question_id
    });
  } catch (error) {
    // Catching potential Zod errors during parse if safeParse wasn't used,
    // or other unexpected errors.
    // Since safeParse is used, this specific ZodError check might be redundant here
    // but good for general error handling.
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters after initial check', // Should ideally be caught by safeParse
          details: error.flatten().fieldErrors
        }, 
        { status: 400 }
      );
    }
    console.error('Error looking up session question:', error);
    return NextResponse.json(
      { error: 'Failed to look up session question' },
      { status: 500 }
    );
  }
}