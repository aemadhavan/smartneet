//File: src/db/schema.ts
import { 
  serial, 
  integer, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  pgTable, 
  primaryKey,
  pgEnum 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Enums ---
export const questionTypeEnum = pgEnum('question_type', [
  'MultipleChoice',
  'Matching',
  'MultipleCorrectStatements',
  'AssertionReason',
  'DiagramBased',
  'SequenceOrdering',
]);

export const questionSourceTypeEnum = pgEnum('question_source_type', [
  'PreviousYear',
  'AI_Generated',
  'Other',
]);

export const difficultyLevelEnum = pgEnum('difficulty_level', [
  'easy',
  'medium',
  'hard'
]);

// --- Core Tables ---

export const subjects = pgTable('subjects', {
  subject_id: serial('subject_id').primaryKey(),
  subject_name: varchar('subject_name', { length: 50 }).notNull(),
  subject_code: varchar('subject_code', { length: 10 }).notNull(),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// First declare the table without the self-reference
export const topics = pgTable('topics', {
  topic_id: serial('topic_id').primaryKey(),
  subject_id: integer('subject_id').notNull().references(() => subjects.subject_id),
  topic_name: varchar('topic_name', { length: 100 }).notNull(),
  parent_topic_id: integer('parent_topic_id'), // We'll add the self-reference in the relations
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const subtopics = pgTable('subtopics', {
  subtopic_id: serial('subtopic_id').primaryKey(),
  topic_id: integer('topic_id').notNull().references(() => topics.topic_id),
  subtopic_name: varchar('subtopic_name', { length: 100 }).notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const exam_years = pgTable('exam_years', {
  year_id: serial('year_id').primaryKey(),
  exam_year: integer('exam_year').notNull().unique(),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const question_papers = pgTable('question_papers', {
  paper_id: serial('paper_id').primaryKey(),
  exam_year_id: integer('exam_year_id').notNull().references(() => exam_years.year_id),
  subject_id: integer('subject_id').notNull().references(() => subjects.subject_id),
  paper_code: varchar('paper_code', { length: 20 }),
  total_questions: integer('total_questions'),
  max_marks: integer('max_marks'),
  time_duration_minutes: integer('time_duration_minutes'),
  source_description: text('source_description'),
  upload_date: timestamp('upload_date').defaultNow(),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const questions = pgTable('questions', {
  question_id: serial('question_id').primaryKey(),
  paper_id: integer('paper_id').references(() => question_papers.paper_id),
  subject_id: integer('subject_id').notNull().references(() => subjects.subject_id),
  topic_id: integer('topic_id').notNull().references(() => topics.topic_id),
  subtopic_id: integer('subtopic_id').references(() => subtopics.subtopic_id),
  question_number: integer('question_number'),
  question_type: questionTypeEnum('question_type').notNull(),
  source_type: questionSourceTypeEnum('source_type').notNull(),
  question_text: text('question_text').notNull(),
  explanation: text('explanation'),
  difficulty_level: difficultyLevelEnum('difficulty_level').default('medium'),
  marks: integer('marks').default(4),
  negative_marks: integer('negative_marks').default(1),
  is_image_based: boolean('is_image_based').default(false),
  image_url: varchar('image_url', { length: 255 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// --- Question Type Specific Tables ---

export const multiple_choice_options = pgTable('multiple_choice_options', {
  option_id: serial('option_id').primaryKey(),
  question_id: integer('question_id').notNull().references(() => questions.question_id, { onDelete: 'cascade' }),
  option_number: integer('option_number').notNull(),
  option_text: text('option_text').notNull(),
  is_correct: boolean('is_correct').default(false)
});

export const assertion_reason_questions = pgTable('assertion_reason_questions', {
  ar_id: serial('ar_id').primaryKey(),
  question_id: integer('question_id').references(() => questions.question_id, { onDelete: 'cascade' }).unique(),
  assertion_text: text('assertion_text').notNull(),
  reason_text: text('reason_text').notNull(),
  correct_option: integer('correct_option').notNull()
});

export const match_columns_questions = pgTable('match_columns_questions', {
  match_id: serial('match_id').primaryKey(),
  question_id: integer('question_id').references(() => questions.question_id, { onDelete: 'cascade' }).unique(),
  left_column_header: text('left_column_header'),
  right_column_header: text('right_column_header')
});

export const match_columns_items = pgTable('match_columns_items', {
  item_id: serial('item_id').primaryKey(),
  match_id: integer('match_id').references(() => match_columns_questions.match_id, { onDelete: 'cascade' }),
  left_item_label: varchar('left_item_label', { length: 10 }).notNull(),
  left_item_text: text('left_item_text').notNull(),
  right_item_label: varchar('right_item_label', { length: 10 }).notNull(),
  right_item_text: text('right_item_text').notNull()
});

export const match_columns_options = pgTable('match_columns_options', {
  option_id: serial('option_id').primaryKey(),
  match_id: integer('match_id').references(() => match_columns_questions.match_id, { onDelete: 'cascade' }),
  option_number: integer('option_number').notNull(),
  option_text: text('option_text').notNull(),
  is_correct: boolean('is_correct').default(false)
});

export const statement_based_questions = pgTable('statement_based_questions', {
  statement_id: serial('statement_id').primaryKey(),
  question_id: integer('question_id').references(() => questions.question_id, { onDelete: 'cascade' }).unique(),
  intro_text: text('intro_text'),
  correct_option: integer('correct_option').notNull()
});

export const statements = pgTable('statements', {
  statement_id: serial('statement_id').primaryKey(),
  statement_based_id: integer('statement_based_id').notNull().references(() => statement_based_questions.statement_id, { onDelete: 'cascade' }),
  statement_number: integer('statement_number').notNull(),
  statement_label: varchar('statement_label', { length: 10 }),
  statement_text: text('statement_text').notNull(),
  is_correct: boolean('is_correct').default(false)
});

export const tags = pgTable('tags', {
  tag_id: serial('tag_id').primaryKey(),
  tag_name: varchar('tag_name', { length: 50 }).notNull().unique()
});

export const question_tags = pgTable('question_tags', {
  question_id: integer('question_id').references(() => questions.question_id, { onDelete: 'cascade' }),
  tag_id: integer('tag_id').references(() => tags.tag_id, { onDelete: 'cascade' })
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.question_id, table.tag_id] })
  };
});

// --- Define Relations ---

export const subjectsRelations = relations(subjects, ({ many }) => ({
  topics: many(topics),
  questionPapers: many(question_papers),
  questions: many(questions)
}));

// Define the relations separately with explicit type annotations
export const topicsRelations = relations(topics, ({ one, many }) => {
  return {
    subject: one(subjects, { fields: [topics.subject_id], references: [subjects.subject_id] }),
    parentTopic: one(topics, { fields: [topics.parent_topic_id], references: [topics.topic_id], relationName: 'parentTopic' }),
    childTopics: many(topics, { relationName: 'parentTopic' }),
    subtopics: many(subtopics),
    questions: many(questions)
  };
});

export const subtopicsRelations = relations(subtopics, ({ one, many }) => ({
  topic: one(topics, { fields: [subtopics.topic_id], references: [topics.topic_id] }),
  questions: many(questions)
}));

export const examYearsRelations = relations(exam_years, ({ many }) => ({
  questionPapers: many(question_papers)
}));

export const questionPapersRelations = relations(question_papers, ({ one, many }) => ({
  examYear: one(exam_years, { fields: [question_papers.exam_year_id], references: [exam_years.year_id] }),
  subject: one(subjects, { fields: [question_papers.subject_id], references: [subjects.subject_id] }),
  questions: many(questions)
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  questionPaper: one(question_papers, { fields: [questions.paper_id], references: [question_papers.paper_id] }),
  subject: one(subjects, { fields: [questions.subject_id], references: [subjects.subject_id] }),
  topic: one(topics, { fields: [questions.topic_id], references: [topics.topic_id] }),
  subtopic: one(subtopics, { fields: [questions.subtopic_id], references: [subtopics.subtopic_id] }),
  multipleChoiceOptions: many(multiple_choice_options),
  assertionReasonQuestion: one(assertion_reason_questions, { fields: [questions.question_id], references: [assertion_reason_questions.question_id] }),
  matchColumnsQuestion: one(match_columns_questions, { fields: [questions.question_id], references: [match_columns_questions.question_id] }),
  statementBasedQuestion: one(statement_based_questions, { fields: [questions.question_id], references: [statement_based_questions.question_id] }),
  questionTags: many(question_tags)
}));

export const multipleChoiceOptionsRelations = relations(multiple_choice_options, ({ one }) => ({
  question: one(questions, { fields: [multiple_choice_options.question_id], references: [questions.question_id] })
}));

export const assertionReasonQuestionsRelations = relations(assertion_reason_questions, ({ one }) => ({
  question: one(questions, { fields: [assertion_reason_questions.question_id], references: [questions.question_id] })
}));

export const matchColumnsQuestionsRelations = relations(match_columns_questions, ({ one, many }) => ({
  question: one(questions, { fields: [match_columns_questions.question_id], references: [questions.question_id] }),
  items: many(match_columns_items),
  options: many(match_columns_options)
}));

export const matchColumnsItemsRelations = relations(match_columns_items, ({ one }) => ({
  matchQuestion: one(match_columns_questions, { fields: [match_columns_items.match_id], references: [match_columns_questions.match_id] })
}));

export const matchColumnsOptionsRelations = relations(match_columns_options, ({ one }) => ({
  matchQuestion: one(match_columns_questions, { fields: [match_columns_options.match_id], references: [match_columns_questions.match_id] })
}));

export const statementBasedQuestionsRelations = relations(statement_based_questions, ({ one, many }) => ({
  question: one(questions, { fields: [statement_based_questions.question_id], references: [questions.question_id] }),
  statements: many(statements)
}));

export const statementsRelations = relations(statements, ({ one }) => ({
  statementBasedQuestion: one(statement_based_questions, { fields: [statements.statement_based_id], references: [statement_based_questions.statement_id] })
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  questionTags: many(question_tags)
}));

export const questionTagsRelations = relations(question_tags, ({ one }) => ({
  question: one(questions, { fields: [question_tags.question_id], references: [questions.question_id] }),
  tag: one(tags, { fields: [question_tags.tag_id], references: [tags.tag_id] })
}));