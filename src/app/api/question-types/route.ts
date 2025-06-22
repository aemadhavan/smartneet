// src/app/api/question-types/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { count, eq } from 'drizzle-orm';
import { question_attempts, questions } from '@/db/schema';
import { cache } from '@/lib/cache'; // Import cache

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `user:${userId}:question-type-distribution`;

    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      // Assuming cachedData stores the final array structure
      return NextResponse.json({ data: cachedData, source: 'cache' });
    }

    // Get distribution of question types from user's attempts (limit to prevent memory issues)
    const questionTypeDistribution = await Promise.race([
      db
        .select({
          question_type: questions.question_type,
          count: count()
        })
        .from(question_attempts)
        .innerJoin(questions, eq(question_attempts.question_id, questions.question_id))
        .where(eq(question_attempts.user_id, userId))
        .groupBy(questions.question_type)
        .limit(50), // Prevent memory exhaustion
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      )
    ]) as Array<{ question_type: string; count: number }>;

    // Format the response for the pie chart
    let dataToReturn;
    let source = 'database';

    if (questionTypeDistribution.length === 0) {
      dataToReturn = [
        { name: 'Multiple Choice', value: 65 },
        { name: 'Multiple Correct Statements', value: 15 },
        { name: 'Assertion Reason', value: 10 },
        { name: 'Matching', value: 5 },
        { name: 'Sequence Ordering', value: 5 }
      ];
      source = 'default_cached'; // Indicate that default data is being served and cached
    } else {
      dataToReturn = questionTypeDistribution.map((item) => {
        // Convert enum values to readable names
        const name = item.question_type
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .trim(); // Remove leading/trailing spaces
        
        return {
          name,
          value: Number(item.count)
        };
      });
    }

    // Cache the result (either formatted data or default data)
    await cache.set(cacheKey, dataToReturn, 3600); // 3600 seconds = 1 hour

    return NextResponse.json({ data: dataToReturn, source: source });
  } catch (error) {
    console.error('Error fetching question type distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question type distribution' },
      { status: 500 }
    );
  }
}