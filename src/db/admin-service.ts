// src/app/db/admin-service.ts
import { db } from './index'; // Assuming this is how your db connection is exported
import { subjects, topics, subtopics, questions, question_papers } from './schema';
import { eq, and, sql } from 'drizzle-orm';

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

export async function getTopicsBySubject(subjectId: string) {
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
  subject_id: string; 
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

export async function getQuestionById(id: number) {
  return db.select().from(questions).where(eq(questions.question_id, id)).limit(1);
}

export async function createQuestion(data: any) {
  return db.insert(questions).values(data).returning();
}

export async function updateQuestion(id: number, data: any) {
  return db.update(questions).set(data).where(eq(questions.question_id, id)).returning();
}

export async function deleteQuestion(id: number) {
  return db.update(questions).set({ is_active: false }).where(eq(questions.question_id, id));
}

// Question Papers
export async function getAllQuestionPapers() {
  return db.select().from(question_papers);
}

export async function getQuestionPaperById(id: number) {
  return db.select().from(question_papers).where(eq(question_papers.paper_id, id)).limit(1);
}

export async function createQuestionPaper(data: any) {
  return db.insert(question_papers).values(data).returning();
}

export async function updateQuestionPaper(id: number, data: any) {
  return db.update(question_papers).set(data).where(eq(question_papers.paper_id, id)).returning();
}

export async function deleteQuestionPaper(id: number) {
  return db.delete(question_papers).where(eq(question_papers.paper_id, id));
}