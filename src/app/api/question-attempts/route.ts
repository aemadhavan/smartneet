// src/app/api/question-attempts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  question_attempts, 
  questions, 
  session_questions 
} from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { 
  evaluateAnswer, 
  parseQuestionDetails, 
  QuestionDetails 
} from '@/lib/utils/answerEvaluation'; // Import centralized functions and types
import { cache } from '@/lib/cache'; // Import cache

// Schema for validating attempt submission
const attemptSchema = z.object({
  session_id: z.number(),
  session_question_id: z.number(),
  question_id: z.number(),
  user_answer: z.any(), // Using any for flexible JSONB data
  time_taken_seconds: z.number().optional(),
  user_notes: z.string().optional()
});

// Record a question attempt
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Expect JSON request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      console.error('Error parsing JSON request body in question-attempts:', error);
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    // Validate the data using the schema
    try {
      const validatedData = attemptSchema.parse(requestData);
      
      // Get question details to evaluate the answer
      const [questionDetails] = await db
        .select({
          question_id: questions.question_id,
          question_type: questions.question_type,
          details: questions.details,
          marks: questions.marks,
          negative_marks: questions.negative_marks,
          topic_id: questions.topic_id
        })
        .from(questions)
        .where(eq(questions.question_id, validatedData.question_id));

      if (!questionDetails) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      // Evaluate if the answer is correct using the centralized function
      // The `questionDetails.details` from the DB should be a JSON object or string.
      // `parseQuestionDetails` will handle converting it to the structured `QuestionDetails` type.
      let parsedDetails: QuestionDetails;
      try {
        // Assuming questionDetails.details is the raw JSON from the database
        parsedDetails = parseQuestionDetails(questionDetails.details); 
      } catch (e) {
        console.error("Error parsing question details in question-attempts route:", e);
        return NextResponse.json({ error: 'Invalid question details format' }, { status: 500 });
      }
      
      const isCorrect = evaluateAnswer(
        questionDetails.question_type, 
        parsedDetails, // Pass the parsed and structured details
        validatedData.user_answer
      );
      
      // Calculate marks awarded
      const marksAwarded = isCorrect ? (questionDetails.marks ?? 4) : -(questionDetails.negative_marks ?? 1);

      // Check if the session question exists
      const [sessionQuestion] = await db
        .select()
        .from(session_questions)
        .where(
          and(
            eq(session_questions.session_question_id, validatedData.session_question_id),
            eq(session_questions.session_id, validatedData.session_id)
          )
        );

      if (!sessionQuestion) {
        return NextResponse.json({ error: 'Session question not found' }, { status: 404 });
      }
      const { recordQuestionAttempt, updateTopicMastery } = await import('@/lib/utilities/sessionUtils');

      // Use the standardized approach to record the attempt and update session
      const result = await recordQuestionAttempt(
        userId,
        validatedData.session_id,
        validatedData.question_id,
        validatedData.session_question_id,
        validatedData.user_answer,
        isCorrect,
        marksAwarded,
        validatedData.time_taken_seconds
      );

      // Update topic mastery
      await updateTopicMastery(userId, questionDetails.topic_id, isCorrect);

      // Invalidate relevant caches
      try {
        await cache.delete(`user:${userId}:stats`);
        await cache.deletePattern(`user:${userId}:question-attempts:*`);
        await cache.delete(`user:${userId}:question-type-distribution`);
        await cache.delete(`session:${userId}:${validatedData.session_id}:active`);
        console.log(`Cache invalidated for user ${userId} due to new question attempt in session ${validatedData.session_id}`);
      } catch (cacheError) {
        console.error('Error during cache invalidation in question-attempts:', cacheError);
        // Non-critical, so don't fail the request, but log it.
      }

      return NextResponse.json({
        attempt_id: result.attempt.attempt_id,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        session_stats: result.sessionStats
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { 
          error: validationError instanceof z.ZodError ? 
            validationError.errors : 
            'Invalid attempt parameters',
          details: validationError instanceof z.ZodError ? 
            validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') : 
            'Unknown validation error'
        }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error recording question attempt:', error);
    return NextResponse.json(
      { error: 'Failed to record question attempt. Please try again.' },
      { status: 500 }
    );
  }
}

// Get attempts history for a user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get('questionId') ? parseInt(searchParams.get('questionId')!) : undefined;
    const sessionId = searchParams.get('sessionId') ? parseInt(searchParams.get('sessionId')!) : undefined;
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Define cache key
    const cacheKey = `user:${userId}:question-attempts:qid:${questionId || 'all'}:sid:${sessionId || 'all'}:limit:${limit}:offset:${offset}`;

    // Try to get from cache first
    const cachedAttempts = await cache.get(cacheKey);
    if (cachedAttempts) {
      return NextResponse.json({ attempts: cachedAttempts, source: 'cache' });
    }

    // Build query conditions
    const conditions = [eq(question_attempts.user_id, userId)];
    
    if (questionId) {
      conditions.push(eq(question_attempts.question_id, questionId));
    }
    
    if (sessionId) {
      conditions.push(eq(question_attempts.session_id, sessionId));
    }

    // Query attempts
    const attempts = await db
      .select()
      .from(question_attempts)
      .where(and(...conditions))
      .orderBy(sql`${question_attempts.attempt_timestamp} DESC`)
      .limit(limit)
      .offset(offset);

    // Cache the result
    await cache.set(cacheKey, attempts, 900); // 900 seconds = 15 minutes

    return NextResponse.json({ attempts: attempts, source: 'database' });
  } catch (error) {
    console.error('Error fetching question attempts:', error);
    return NextResponse.json({ error: 'Failed to fetch question attempts' }, { status: 500 });
  }
}

// The local evaluateAnswer function and related types (MultipleChoiceDetails, etc.)
// have been removed as they are now imported from '@/lib/utils/answerEvaluation.ts'.