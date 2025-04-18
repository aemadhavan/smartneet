// src/app/api/question-types/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { count, eq } from 'drizzle-orm';
import { question_attempts, questions } from '@/db/schema';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get distribution of question types from user's attempts
    const questionTypeDistribution = await db
      .select({
        question_type: questions.question_type,
        count: count()
      })
      .from(question_attempts)
      .innerJoin(questions, eq(question_attempts.question_id, questions.question_id))
      .where(eq(question_attempts.user_id, userId))
      .groupBy(questions.question_type);

    // Format the response for the pie chart
    const formattedData = questionTypeDistribution.map((item) => {
      // Convert enum values to readable names
      const name = item.question_type
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .trim(); // Remove leading/trailing spaces
      
      return {
        name,
        value: Number(item.count)
      };
    });

    // If no data, return default distribution
    if (formattedData.length === 0) {
      return NextResponse.json([
        { name: 'Multiple Choice', value: 65 },
        { name: 'Multiple Correct Statements', value: 15 },
        { name: 'Assertion Reason', value: 10 },
        { name: 'Matching', value: 5 },
        { name: 'Sequence Ordering', value: 5 }
      ]);
    }

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching question type distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question type distribution' },
      { status: 500 }
    );
  }
}