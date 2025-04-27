// src/app/api/session-questions/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session_questions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

// Schema for validating lookup request
const lookupSchema = z.object({
  session_id: z.number(),
  question_id: z.number()
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get data from request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    // Validate the data
    try {
      const validatedData = lookupSchema.parse(requestData);
      
      // Look up the session question
      const [sessionQuestion] = await db
        .select({
          session_question_id: session_questions.session_question_id
        })
        .from(session_questions)
        .where(
          and(
            eq(session_questions.session_id, validatedData.session_id),
            eq(session_questions.question_id, validatedData.question_id)
          )
        );

      if (!sessionQuestion) {
        return NextResponse.json({ 
          error: 'Session question not found' 
        }, { status: 404 });
      }

      // Return the session_question_id
      return NextResponse.json({
        session_question_id: sessionQuestion.session_question_id
      });
    } catch (validationError) {
      return NextResponse.json(
        { 
          error: validationError instanceof z.ZodError ? 
            validationError.errors : 
            'Invalid parameters'
        }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error looking up session question:', error);
    return NextResponse.json(
      { error: 'Failed to look up session question' },
      { status: 500 }
    );
  }
}