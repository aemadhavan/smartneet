// src/app/api/admin/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  // getAllQuestions, // Removed unused import
  getQuestionById,
  // getQuestionsByTopic, // Removed unused import
  // getQuestionsBySubtopic, // Removed unused import
  // getQuestionsByPaperId, // Removed unused import
  getQuestionsBySubject,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  updateQuestionPaperCount
} from '@/db/admin-service';
import { 
  difficultyLevelEnum, 
  questionTypeEnum 
} from '@/db/schema';
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Extract all possible filter parameters
    const id = url.searchParams.get('id');
    const subjectId = url.searchParams.get('subject_id') || url.searchParams.get('subjectId');
    const topicId = url.searchParams.get('topic_id') || url.searchParams.get('topicId');
    const subtopicId = url.searchParams.get('subtopic_id') || url.searchParams.get('subtopicId');
    const paperId = url.searchParams.get('paper_id') || url.searchParams.get('paperId');
    
    // Pagination parameters
    const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : 1;
    const pageSize = url.searchParams.get('pageSize') ? Number(url.searchParams.get('pageSize')) : 10;
    const offset = (page - 1) * pageSize;
    
    // Additional filter parameters with type-safe casting
    const difficultyLevel = url.searchParams.get('difficulty_level') || url.searchParams.get('difficultyLevel');
    const questionType = url.searchParams.get('question_type') || url.searchParams.get('questionType');
    const searchTerm = url.searchParams.get('search') || url.searchParams.get('searchTerm');

    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Direct ID lookup
    if (id) {
      const question = await getQuestionById(Number(id));
      
      if (!question || question.length === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      
      return NextResponse.json(question[0]);
    }

    // Build comprehensive query
    let questions = [];
    let total = 0;

    // Type-safe filtering
    const filters: Parameters<typeof getQuestionsBySubject>[1] = {
      topicId: topicId ? Number(topicId) : undefined,
      subtopicId: subtopicId ? Number(subtopicId) : undefined,
      paperId: paperId ? Number(paperId) : undefined,
      difficultyLevel: difficultyLevel as typeof difficultyLevelEnum.enumValues[number] | undefined,
      questionType: questionType as typeof questionTypeEnum.enumValues[number] | undefined,
      searchTerm: searchTerm || undefined,
      limit: pageSize,
      offset: offset
    };

    // New function in admin-service to handle complex filtering
    const { questions: fetchedQuestions, total: totalQuestions } = await getQuestionsBySubject(
      Number(subjectId || 3), 
      filters
    );

    questions = fetchedQuestions;
    total = totalQuestions;

    // Return paginated results
    return NextResponse.json({
      questions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch questions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.question_text || !data.question_type) {
      return NextResponse.json(
        { error: 'Question text and type are required' }, 
        { status: 400 }
      );
    }
    
    const newQuestion = await createQuestion(data);
    
    // If this is associated with a paper, update the paper's question count
    if (data.paper_id) {
      await updateQuestionPaperCount(data.paper_id);
    }
    
    return NextResponse.json(newQuestion[0], { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.question_id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    const question = await getQuestionById(data.question_id);
    if (!question || question.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    const oldPaperId = question[0].paper_id;
    const newPaperId = data.paper_id;
    
    const updated = await updateQuestion(data.question_id, data);
    
    // If paper ID changed, update question counts for both papers
    if (oldPaperId !== newPaperId) {
      if (oldPaperId) {
        await updateQuestionPaperCount(oldPaperId);
      }
      if (newPaperId) {
        await updateQuestionPaperCount(newPaperId);
      }
    }
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    // Get the question to check if it's associated with a paper
    const question = await getQuestionById(Number(id));
    if (!question || question.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    const paperId = question[0].paper_id;
    
    await deleteQuestion(Number(id));
    
    // If the question was associated with a paper, update the paper's question count
    if (paperId) {
      await updateQuestionPaperCount(paperId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
