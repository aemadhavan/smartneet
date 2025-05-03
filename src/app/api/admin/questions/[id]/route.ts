// src/app/api/admin/questions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withCache } from '@/lib/cache';
import { auth } from '@clerk/nextjs/server';
//import { currentUser } from '@clerk/nextjs/server';
import { CacheInvalidator } from '@/lib/cacheInvalidation';

// GET endpoint - Fetch a question by ID
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise to get the id
  const { id } = await params;
  const questionId = parseInt(id);
  
  // Generate a cache key
  const cacheKey = `question:${questionId}:details`;
  
  try {
    // Try to get from cache first
    const result = await withCache(
      async () => {
        const questionData = await db.select()
          .from(questions)
          .where(eq(questions.question_id, questionId))
          .limit(1);
        
        if (questionData.length === 0) {
          return null;
        }
        
        return questionData[0];
      },
      cacheKey,
      3600 // 1 hour cache
    )();
    
    if (!result) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// PUT endpoint - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get the question ID from URL params
  const { id } = await params;
  const questionId = parseInt(id);
  
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Get the user to check their role (optional - implement based on your auth setup)
  // const clerkUser = await currentUser(); // Removed unused variable
  // Implement role check if needed
  // if (!clerkUser?.publicMetadata?.role || clerkUser.publicMetadata.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }
  
  try {
    // Parse request body
    const updatedQuestion = await request.json();
    
    // Validate required fields
    if (!updatedQuestion.question_text || !updatedQuestion.question_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if question exists
    const existingQuestion = await db.select({ id: questions.question_id })
      .from(questions)
      .where(eq(questions.question_id, questionId))
      .limit(1);
      
    if (existingQuestion.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Prepare data for update - destructure to remove unwanted fields
    const { 
      // question_id: _id, // Removed unused variable
      // created_at: _createdAt, // Removed unused variable
      ...updateData 
    } = updatedQuestion;

    // Add updated_at timestamp
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date()
    };
    
    // Update in database
    await db.update(questions)
      .set(dataToUpdate)
      .where(eq(questions.question_id, questionId));
    
    // Invalidate cache
    await CacheInvalidator.invalidateQuestion(
      questionId, 
      updatedQuestion.topic_id, 
      updatedQuestion.subtopic_id
    );
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Question updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE endpoint - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get the question ID from URL params
  const { id } = await params;
  const questionId = parseInt(id);
  
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Get the user to check their role (optional)
  // const clerkUser = await currentUser(); // Removed unused variable
  // Implement role check if needed
  // if (!clerkUser?.publicMetadata?.role || clerkUser.publicMetadata.role !== 'admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }
  
  try {
    // Get question details for cache invalidation
    const questionData = await db.select({
      topic_id: questions.topic_id,
      subtopic_id: questions.subtopic_id
    })
    .from(questions)
    .where(eq(questions.question_id, questionId))
    .limit(1);
    
    if (questionData.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    const { topic_id, subtopic_id } = questionData[0];
    
    // Delete the question
    await db.delete(questions)
      .where(eq(questions.question_id, questionId));
    
    // Invalidate caches
    await CacheInvalidator.invalidateQuestion(
      questionId,
      topic_id,
      subtopic_id ?? undefined // Convert null to undefined
    );
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Question deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
