// src/app/db/admin-service.ts
import { db } from './index'; // Assuming this is how your db connection is exported
import { subjects, topics, subtopics, questions, question_papers, exam_years } from '@/db/schema';
import { eq, and, sql, asc, desc } from 'drizzle-orm';
import { questionTypeEnum, questionSourceTypeEnum, difficultyLevelEnum } from '@/db/schema';

// Subjects
export async function getAllSubjects() {
  return db.select().from(subjects).where(eq(subjects.is_active, true));
}

export async function getSubjectById(id: number) {
  return db.select().from(subjects).where(eq(subjects.subject_id, id)).limit(1);
}

export async function createSubject(data: { subject_name: string; subject_code: string }) {
  return db.insert(subjects).values(data).returning();
}

export async function updateSubject(id: number, data: { subject_name?: string; subject_code?: string; is_active?: boolean }) {
  return db.update(subjects).set(data).where(eq(subjects.subject_id, id)).returning();
}

export async function deleteSubject(id: number) {
  return db.update(subjects).set({ is_active: false }).where(eq(subjects.subject_id, id));
}

// Topics
export async function getAllTopics() {
  return db.select().from(topics).where(eq(topics.is_active, true));
}

export async function getTopicsBySubject(subjectId: number) {
  return db.select().from(topics)
    .where(and(
      eq(topics.subject_id, subjectId),
      eq(topics.is_active, true)
    ));
}

export async function getTopicById(id: number) {
  return db.select().from(topics).where(eq(topics.topic_id, id)).limit(1);
}

export async function createTopic(data: { 
  subject_id: number; 
  topic_name: string; 
  parent_topic_id?: number;
  description?: string;
}) {
  return db.insert(topics).values(data).returning();
}

export async function updateTopic(id: number, data: { 
  topic_name?: string; 
  parent_topic_id?: number | null;
  description?: string;
  is_active?: boolean;
}) {
  return db.update(topics).set(data).where(eq(topics.topic_id, id)).returning();
}

export async function deleteTopic(id: number) {
  return db.update(topics).set({ is_active: false }).where(eq(topics.topic_id, id));
}

// Subtopics
export async function getAllSubtopics() {
  return db.select().from(subtopics).where(eq(subtopics.is_active, true));
}

export async function getSubtopicsByTopic(topicId: number) {
  return db.select().from(subtopics)
    .where(and(
      eq(subtopics.topic_id, topicId),
      eq(subtopics.is_active, true)
    ));
}

export async function getSubtopicById(id: number) {
  return db.select().from(subtopics).where(eq(subtopics.subtopic_id, id)).limit(1);
}

export async function createSubtopic(data: { 
  topic_id: number; 
  subtopic_name: string; 
  description?: string;
}) {
  return db.insert(subtopics).values(data).returning();
}

export async function updateSubtopic(id: number, data: { 
  topic_id?: number;
  subtopic_name?: string; 
  description?: string;
  is_active?: boolean;
}) {
  return db.update(subtopics).set(data).where(eq(subtopics.subtopic_id, id)).returning();
}

export async function deleteSubtopic(id: number) {
  return db.update(subtopics).set({ is_active: false }).where(eq(subtopics.subtopic_id, id));
}

// Questions
export async function getAllQuestions(limit = 100, offset = 0) {
  return db.select().from(questions)
    .where(eq(questions.is_active, true))
    .orderBy(asc(questions.question_id))
    .limit(limit)
    .offset(offset);
}

export async function getQuestionsByTopic(topicId: number) {
  return db.select().from(questions)
    .where(and(
      eq(questions.topic_id, topicId),
      eq(questions.is_active, true)
    ));
}

export async function getQuestionsBySubtopic(subtopicId: number) {
  return db.select().from(questions)
    .where(and(
      eq(questions.subtopic_id, subtopicId),
      eq(questions.is_active, true)
    ));
}

export async function getQuestionsByPaperId(paperId: number) {
  return db.select().from(questions)
    .where(and(
      eq(questions.paper_id, paperId),
      eq(questions.is_active, true)
    ));
}

export async function getQuestionById(id: number) {
  return db.select().from(questions).where(eq(questions.question_id, id)).limit(1);
}

// Define a type for question details
interface QuestionDetails {
  options?: Array<{ option_number: string | number; option_text: string; is_correct: boolean }>;
  statements?: Array<{ statement_label: string; statement_text: string; is_correct: boolean }>;
  assertion_text?: string;
  reason_text?: string;
  left_column_header?: string;
  right_column_header?: string;
  items?: Array<{
    left_item_label?: string;
    left_item_text?: string;
    right_item_label?: string;
    right_item_text?: string;
    item_number?: number;
    item_label?: string;
    item_text?: string;
  }>;
  intro_text?: string;
  correct_option?: number | string;
  correct_sequence?: string | number[];
}

export async function createQuestion(data: Partial<QuestionCreate> & { 
  question_text: string;
  question_type: string; 
  source_type?: string;
  details?: QuestionDetails;
}) {
  // Default values and validation
  if (!data.subject_id) {
    throw new Error("subject_id is required");
  }

  if (!data.topic_id) {
    throw new Error("topic_id is required");
  }

  // Map string types to enum values and handle required fields
  const questionData = {
    subject_id: data.subject_id,
    topic_id: data.topic_id,
    question_number: data.question_number || 1.0,
    question_text: data.question_text,
    // Validate and cast enum types
    question_type: validateQuestionType(data.question_type),
    source_type: validateSourceType(data.source_type || 'PreviousYear'),
    // Add details field (required by schema)
    details: data.details || {},
    // Optional fields
    paper_id: data.paper_id,
    subtopic_id: data.subtopic_id,
    explanation: data.explanation,
    difficulty_level: data.difficulty_level ? validateDifficultyLevel(data.difficulty_level) : undefined,
    marks: data.marks,
    negative_marks: data.negative_marks,
    is_image_based: data.is_image_based,
    image_url: data.image_url,
    is_active: data.is_active
  };
  
  return db.insert(questions).values(questionData).returning();
}

export async function updateQuestion(id: number, data: Partial<QuestionUpdate>) {
  // Create a clean update object
  const updateData: Record<string, unknown> = {};
  
  // Copy basic fields directly
  if (data.subject_id !== undefined) updateData.subject_id = data.subject_id;
  if (data.paper_id !== undefined) updateData.paper_id = data.paper_id;
  if (data.topic_id !== undefined) updateData.topic_id = data.topic_id;
  if (data.subtopic_id !== undefined) updateData.subtopic_id = data.subtopic_id;
  if (data.question_number !== undefined) updateData.question_number = data.question_number;
  if (data.question_text !== undefined) updateData.question_text = data.question_text;
  if (data.explanation !== undefined) updateData.explanation = data.explanation;
  if (data.marks !== undefined) updateData.marks = data.marks;
  if (data.negative_marks !== undefined) updateData.negative_marks = data.negative_marks;
  if (data.is_image_based !== undefined) updateData.is_image_based = data.is_image_based;
  if (data.image_url !== undefined) updateData.image_url = data.image_url;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.details !== undefined) updateData.details = data.details;
  
  // Handle and validate enum fields
  if (data.question_type !== undefined) {
    updateData.question_type = validateQuestionType(data.question_type);
  }
  
  if (data.source_type !== undefined) {
    updateData.source_type = validateSourceType(data.source_type);
  }
  
  if (data.difficulty_level !== undefined) {
    updateData.difficulty_level = validateDifficultyLevel(data.difficulty_level);
  }
  
  // Set update timestamp
  updateData.updated_at = new Date();
  
  return db.update(questions).set(updateData).where(eq(questions.question_id, id)).returning();
}

// Helper functions to validate enum values
function validateQuestionType(type: string): typeof questionTypeEnum.enumValues[number] {
  const validTypes = questionTypeEnum.enumValues;
  if (!validTypes.includes(type as typeof questionTypeEnum.enumValues[number])) {
    throw new Error(`Invalid question type: ${type}. Valid types are: ${validTypes.join(', ')}`);
  }
  return type as typeof questionTypeEnum.enumValues[number];
}
function validateSourceType(type: string): typeof questionSourceTypeEnum.enumValues[number] {
  const validTypes = questionSourceTypeEnum.enumValues;
  if (!validTypes.includes(type as typeof questionSourceTypeEnum.enumValues[number])) {
    throw new Error(`Invalid source type: ${type}. Valid types are: ${validTypes.join(', ')}`);
  }
  return type as typeof questionSourceTypeEnum.enumValues[number];
}

function validateDifficultyLevel(level: string): typeof difficultyLevelEnum.enumValues[number] {
  const validLevels = difficultyLevelEnum.enumValues;
  if (!validLevels.includes(level as typeof difficultyLevelEnum.enumValues[number])) {
    throw new Error(`Invalid difficulty level: ${level}. Valid levels are: ${validLevels.join(', ')}`);
  }
  return level as typeof difficultyLevelEnum.enumValues[number];
}
export async function deleteQuestion(id: number) {
  return db.update(questions).set({ is_active: false }).where(eq(questions.question_id, id));
}

// Question Papers
export async function getAllQuestionPapers() {
  // Join with exam_years and subjects to get the data needed for the frontend
  return db.select({
    paper_id: question_papers.paper_id,
    paper_year: exam_years.exam_year,
    paper_code: question_papers.paper_code,
    subject: subjects.subject_name,
    section: sql<string | null>`null`, // Placeholder for section field
    total_questions: question_papers.total_questions,
    max_marks: question_papers.max_marks,
    time_duration_minutes: question_papers.time_duration_minutes,
    source: question_papers.source_description,
    upload_date: question_papers.upload_date,
  })
  .from(question_papers)
  .leftJoin(exam_years, eq(question_papers.exam_year_id, exam_years.year_id))
  .leftJoin(subjects, eq(question_papers.subject_id, subjects.subject_id))
  .where(eq(question_papers.is_active, true))
  .orderBy(desc(question_papers.created_at));
}

export async function getQuestionPaperById(id: number) {
  return db.select({
    paper_id: question_papers.paper_id,
    paper_year: exam_years.exam_year,
    paper_code: question_papers.paper_code,
    subject: subjects.subject_name,
    section: sql<string | null>`null`, // Placeholder for section field
    total_questions: question_papers.total_questions,
    max_marks: question_papers.max_marks,
    time_duration_minutes: question_papers.time_duration_minutes,
    source: question_papers.source_description,
    upload_date: question_papers.upload_date,
  })
  .from(question_papers)
  .leftJoin(exam_years, eq(question_papers.exam_year_id, exam_years.year_id))
  .leftJoin(subjects, eq(question_papers.subject_id, subjects.subject_id))
  .where(eq(question_papers.paper_id, id));
}

export async function createQuestionPaper(data: {
  paper_year: number;
  paper_code?: string | null;
  subject: string;
  section?: string | null;
  total_questions?: number | null;
  max_marks?: number | null;
  time_duration_minutes?: number | null;
  source?: string | null;
}) {
  // First find or create the exam year
  const examYearEntry = await db.select().from(exam_years).where(eq(exam_years.exam_year, data.paper_year)).limit(1);
  let examYearId: number;
  
  if (examYearEntry.length === 0) {
    // Create the exam year if it doesn't exist
    const newExamYear = await db.insert(exam_years).values({
      exam_year: data.paper_year,
      description: `Exam year ${data.paper_year}`
    }).returning();
    examYearId = newExamYear[0].year_id;
  } else {
    examYearId = examYearEntry[0].year_id;
  }
  
  // Find the subject ID
  const subjectEntry = await db.select().from(subjects).where(eq(subjects.subject_name, data.subject)).limit(1);
  if (subjectEntry.length === 0) {
    throw new Error(`Subject '${data.subject}' not found`);
  }
  
  const subjectId = subjectEntry[0].subject_id;
  
  // Create the question paper
  return db.insert(question_papers).values({
    exam_year_id: examYearId,
    subject_id: subjectId,
    paper_code: data.paper_code || null,
    total_questions: data.total_questions || null,
    max_marks: data.max_marks || null,
    time_duration_minutes: data.time_duration_minutes || null,
    source_description: data.source || null
  }).returning();
}

export async function updateQuestionPaper(id: number, data: {
  paper_year?: number;
  paper_code?: string | null;
  subject?: string;
  section?: string | null;
  total_questions?: number | null;
  max_marks?: number | null;
  time_duration_minutes?: number | null;
  source?: string | null;
}) {
  const updateData: Record<string, unknown> = {};
  
  // Handle exam year update if provided
  if (data.paper_year) {
    const examYearEntry = await db.select().from(exam_years).where(eq(exam_years.exam_year, data.paper_year)).limit(1);
    let examYearId: number;
    
    if (examYearEntry.length === 0) {
      // Create the exam year if it doesn't exist
      const newExamYear = await db.insert(exam_years).values({
        exam_year: data.paper_year,
        description: `Exam year ${data.paper_year}`
      }).returning();
      examYearId = newExamYear[0].year_id;
    } else {
      examYearId = examYearEntry[0].year_id;
    }
    
    updateData.exam_year_id = examYearId;
  }
  
  // Handle subject update if provided
  if (data.subject) {
    const subjectEntry = await db.select().from(subjects).where(eq(subjects.subject_name, data.subject)).limit(1);
    if (subjectEntry.length === 0) {
      throw new Error(`Subject '${data.subject}' not found`);
    }
    updateData.subject_id = subjectEntry[0].subject_id;
  }
  
  // Add other fields to update
  if (data.paper_code !== undefined) updateData.paper_code = data.paper_code;
  if (data.total_questions !== undefined) updateData.total_questions = data.total_questions;
  if (data.max_marks !== undefined) updateData.max_marks = data.max_marks;
  if (data.time_duration_minutes !== undefined) updateData.time_duration_minutes = data.time_duration_minutes;
  if (data.source !== undefined) updateData.source_description = data.source;
  
  return db.update(question_papers).set(updateData).where(eq(question_papers.paper_id, id)).returning();
}

export async function deleteQuestionPaper(id: number) {
  return db.delete(question_papers).where(eq(question_papers.paper_id, id));
}

// Count questions by paper ID
export async function countQuestionsByPaperId(paperId: number) {
  const result = await db.select({
    count: sql`count(*)`
  }).from(questions).where(eq(questions.paper_id, paperId));
  
  return Number(result[0].count);
}

// Update question paper with actual question count
export async function updateQuestionPaperCount(paperId: number) {
  const count = await countQuestionsByPaperId(paperId);
  
  return db.update(question_papers)
    .set({ total_questions: count })
    .where(eq(question_papers.paper_id, paperId))
    .returning();
}

interface QuestionCreate {
  paper_id?: number;
  subject_id: number; // Required by schema
  question_number: number;
  topic_id: number; // Required by schema
  subtopic_id?: number;
  question_type: typeof questionTypeEnum.enumValues[number]; // Use enum type directly
  source_type: typeof questionSourceTypeEnum.enumValues[number]; // Use enum type directly
  question_text: string;
  explanation?: string;
  details: QuestionDetails; // Add the details field as required
  difficulty_level?: typeof difficultyLevelEnum.enumValues[number];
  marks?: number;
  negative_marks?: number;
  is_image_based?: boolean;
  image_url?: string;
  is_active?: boolean;
}

interface QuestionUpdate {
  paper_id?: number;
  subject_id?: number;
  question_number?: number;
  topic_id?: number;
  subtopic_id?: number | null;
  question_type?: typeof questionTypeEnum.enumValues[number];
  source_type?: typeof questionSourceTypeEnum.enumValues[number];
  question_text?: string;
  explanation?: string;
  details?: QuestionDetails; // Add details field to update interface
  difficulty_level?: typeof difficultyLevelEnum.enumValues[number];
  marks?: number;
  negative_marks?: number;
  is_image_based?: boolean;
  image_url?: string;
  is_active?: boolean;
  updated_at?: Date;
}