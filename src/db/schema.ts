import { serial, integer, varchar, text, boolean, timestamp, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Existing tables (already in your schema.ts)
export const subjects = pgTable('subjects', {
  subject_id: serial('subject_id').primaryKey(),
  subject_name: varchar('subject_name', { length: 50 }).notNull(),
  subject_code: varchar('subject_code', { length: 10 }).notNull(),
  is_active: boolean('is_active').default(true)
});

// First define the topics table (modified to match the new schema)
export const topics = pgTable('topics', {
  topic_id: serial('topic_id').primaryKey(),
  subject_id: varchar('subject_id', { length: 50 }).notNull(), // Changed to VARCHAR as per paste.txt
  topic_name: varchar('topic_name', { length: 100 }).notNull(),
  parent_topic_id: integer('parent_topic_id'), // Will reference itself
  description: text('description'),
  is_active: boolean('is_active').default(true)
});

// Then add the self-reference
// Then define the relations separately
export const topicsRelations = relations(topics, ({ one }) => ({
    parentTopic: one(topics, {
      fields: [topics.parent_topic_id],
      references: [topics.topic_id],
      relationName: 'parentTopic'
    })
  }));

// Modified subtopics to match the new schema
export const subtopics = pgTable('subtopics', {
  subtopic_id: serial('subtopic_id').primaryKey(),
  topic_id: integer('topic_id').references(() => topics.topic_id),
  subtopic_name: varchar('subtopic_name', { length: 100 }).notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true)
});

// Keep the existing exam_years table
export const exam_years = pgTable('exam_years', {
  year_id: serial('year_id').primaryKey(),
  exam_year: integer('exam_year').notNull(),
  is_active: boolean('is_active').default(true)
});

// New tables from paste.txt
export const question_papers = pgTable('question_papers', {
  paper_id: serial('paper_id').primaryKey(),
  paper_year: integer('paper_year').notNull(),
  paper_code: varchar('paper_code', { length: 20 }),
  subject: varchar('subject', { length: 50 }).notNull(),
  section: varchar('section', { length: 10 }),
  total_questions: integer('total_questions'),
  max_marks: integer('max_marks'),
  time_duration_minutes: integer('time_duration_minutes'),
  source: varchar('source', { length: 100 }),
  upload_date: timestamp('upload_date').defaultNow()
});

export const questions = pgTable('questions', {
  question_id: serial('question_id').primaryKey(),
  paper_id: integer('paper_id').references(() => question_papers.paper_id),
  question_number: integer('question_number').notNull(),
  topic_id: integer('topic_id').references(() => topics.topic_id),
  subtopic_id: integer('subtopic_id').references(() => subtopics.subtopic_id),
  question_type: varchar('question_type', { length: 50 }).notNull(), //
  question_text: text('question_text').notNull(),
  explanation: text('explanation'),
  difficulty_level: varchar('difficulty_level', { length: 20 }).default('medium'),
  marks: integer('marks').default(1),
  is_image_based: boolean('is_image_based').default(false),
  image_url: varchar('image_url', { length: 255 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const multiple_choice_options = pgTable('multiple_choice_options', {
  option_id: serial('option_id').primaryKey(),
  question_id: integer('question_id').references(() => questions.question_id),
  option_number: integer('option_number').notNull(),
  option_text: text('option_text').notNull(),
  is_correct: boolean('is_correct').default(false)
});

export const assertion_reason_questions = pgTable('assertion_reason_questions', {
  ar_id: serial('ar_id').primaryKey(),
  question_id: integer('question_id').references(() => questions.question_id).unique(),
  assertion_text: text('assertion_text').notNull(),
  reason_text: text('reason_text').notNull(),
  correct_option: integer('correct_option').notNull()
});

export const match_columns_questions = pgTable('match_columns_questions', {
  match_id: serial('match_id').primaryKey(),
  question_id: integer('question_id').references(() => questions.question_id).unique(),
  left_column_header: text('left_column_header'),
  right_column_header: text('right_column_header')
});

export const match_columns_items = pgTable('match_columns_items', {
  item_id: serial('item_id').primaryKey(),
  match_id: integer('match_id').references(() => match_columns_questions.match_id),
  left_item_label: varchar('left_item_label', { length: 10 }).notNull(),
  left_item_text: text('left_item_text').notNull(),
  right_item_label: varchar('right_item_label', { length: 10 }).notNull(),
  right_item_text: text('right_item_text').notNull()
});

export const match_columns_options = pgTable('match_columns_options', {
  option_id: serial('option_id').primaryKey(),
  match_id: integer('match_id').references(() => match_columns_questions.match_id),
  option_number: integer('option_number').notNull(),
  option_text: text('option_text').notNull(),
  is_correct: boolean('is_correct').default(false)
});

export const statement_based_questions = pgTable('statement_based_questions', {
  statement_id: serial('statement_id').primaryKey(),
  question_id: integer('question_id').references(() => questions.question_id).unique(),
  intro_text: text('intro_text'),
  correct_option: integer('correct_option').notNull()
});

export const statements = pgTable('statements', {
  statement_id: serial('statement_id').primaryKey(),
  question_id: integer('question_id').references(() => questions.question_id),
  statement_number: integer('statement_number').notNull(),
  statement_text: text('statement_text').notNull(),
  is_correct: boolean('is_correct').default(false)
});

export const tags = pgTable('tags', {
  tag_id: serial('tag_id').primaryKey(),
  tag_name: varchar('tag_name', { length: 50 }).notNull().unique()
});

export const question_tags = pgTable('question_tags', {
  question_id: integer('question_id').references(() => questions.question_id),
  tag_id: integer('tag_id').references(() => tags.tag_id)
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.question_id, table.tag_id] })
  };
});