// src/app/practice-sessions/[sessionId]/review/page.tsx
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { practice_sessions } from '@/db';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import ReviewPage from './review';

interface PageProps {
  params: {
    sessionId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function PracticeSessionReviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { userId } = await auth();
  const sessionId = parseInt((await params).sessionId);

  if (!userId || isNaN(sessionId)) {
    return notFound();
  }

  // Check if the session exists and belongs to the user
  // We don't need to fetch all the session data here, just check if it exists
  const sessionExists = await db.query.practice_sessions.findFirst({
    where: eq(practice_sessions.session_id, sessionId),
    columns: {
      session_id: true,
      user_id: true
    }
  });

  if (!sessionExists || sessionExists.user_id !== userId) {
    return notFound();
  }

  return (
    <ReviewPage params={{ sessionId: (await params).sessionId }} />
  );
}
