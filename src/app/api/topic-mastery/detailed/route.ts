// // src/app/api/topic-mastery/detailed/route.ts
// import { NextResponse } from 'next/server';
// import { db } from '@/db';
// import { topic_mastery, topics, subjects } from '@/db/schema';
// import { eq } from 'drizzle-orm';
// import { auth } from '@clerk/nextjs/server';
// import { cache } from '@/lib/cache'; // Import cache

// // Get detailed topic mastery data including subject information
// export async function GET() {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const cacheKey = `user:${userId}:topic-mastery:detailed`;

//     // Try to get from cache first
//     const cachedData = await cache.get(cacheKey);
//     if (cachedData) {
//       return NextResponse.json({ data: cachedData, source: 'cache' });
//     }

//     // Query to get detailed topic mastery data with subject names
//     const detailedTopicMasteryFromDb = await db // Renamed to avoid confusion
//       .select({
//         mastery_id: topic_mastery.mastery_id,
//         user_id: topic_mastery.user_id,
//         topic_id: topic_mastery.topic_id,
//         topic_name: topics.topic_name,
//         mastery_level: topic_mastery.mastery_level,
//         questions_attempted: topic_mastery.questions_attempted,
//         questions_correct: topic_mastery.questions_correct,
//         accuracy_percentage: topic_mastery.accuracy_percentage,
//         last_practiced: topic_mastery.last_practiced,
//         streak_count: topic_mastery.streak_count,
//         subject_id: topics.subject_id,
//         subject_name: subjects.subject_name
//       })
//       .from(topic_mastery)
//       .innerJoin(topics, eq(topic_mastery.topic_id, topics.topic_id))
//       .innerJoin(subjects, eq(topics.subject_id, subjects.subject_id))
//       .where(eq(topic_mastery.user_id, userId));

//     // Cache the result
//     await cache.set(cacheKey, detailedTopicMasteryFromDb, 3600); // 3600 seconds = 1 hour

//     return NextResponse.json({ data: detailedTopicMasteryFromDb, source: 'database' });
//   } catch (error) {
//     console.error('Error fetching detailed topic mastery data:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch detailed topic mastery data' },
//       { status: 500 }
//     );
//   }
// }