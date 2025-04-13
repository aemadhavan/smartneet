import { 
  serial, 
  integer, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  pgTable, 
  primaryKey,
  pgEnum,
  jsonb, // Add jsonb for PostgreSQL JSON support
  uniqueIndex
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

export const topics = pgTable('topics', {
  topic_id: serial('topic_id').primaryKey(),
  subject_id: integer('subject_id').notNull().references(() => subjects.subject_id),
  topic_name: varchar('topic_name', { length: 100 }).notNull(),
  parent_topic_id: integer('parent_topic_id'),
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
  details: jsonb('details').notNull(), // JSONB column for type-specific details
  difficulty_level: difficultyLevelEnum('difficulty_level').default('medium'),
  marks: integer('marks').default(4),
  negative_marks: integer('negative_marks').default(1),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
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

// --- Sequence Tables ---
export const sequence_ordering_questions = pgTable('sequence_ordering_questions', {
  sequence_id: serial('sequence_id').primaryKey(),
  question_id: integer('question_id').notNull().references(() => questions.question_id, { onDelete: 'cascade' }),
  intro_text: text('intro_text'),
  correct_sequence: text('correct_sequence').notNull()
}, (table) => {
  return {
    uniqueQuestionIdx: uniqueIndex('unique_sequence_question_idx').on(table.question_id)
  };
});

export const sequence_items = pgTable('sequence_items', {
  item_id: serial('item_id').primaryKey(),
  sequence_id: integer('sequence_id').notNull().references(() => sequence_ordering_questions.sequence_id, { onDelete: 'cascade' }),
  item_number: integer('item_number').notNull(),
  item_label: varchar('item_label', { length: 10 }),
  item_text: text('item_text').notNull()
});

// --- Define Relations ---

export const subjectsRelations = relations(subjects, ({ many }) => ({
  topics: many(topics),
  questionPapers: many(question_papers),
  questions: many(questions)
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, { fields: [topics.subject_id], references: [subjects.subject_id] }),
  parentTopic: one(topics, { fields: [topics.parent_topic_id], references: [topics.topic_id], relationName: 'parentTopic' }),
  childTopics: many(topics, { relationName: 'parentTopic' }),
  subtopics: many(subtopics),
  questions: many(questions)
}));

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
  questionTags: many(question_tags),
  sequenceQuestion: one(sequence_ordering_questions, { fields: [questions.question_id], references: [sequence_ordering_questions.question_id] })
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  questionTags: many(question_tags)
}));

export const questionTagsRelations = relations(question_tags, ({ one }) => ({
  question: one(questions, { fields: [question_tags.question_id], references: [questions.question_id] }),
  tag: one(tags, { fields: [question_tags.tag_id], references: [tags.tag_id] })
}));

// Add relations for sequence tables
export const sequenceOrderingQuestionsRelations = relations(sequence_ordering_questions, ({ one, many }) => ({
  question: one(questions, { fields: [sequence_ordering_questions.question_id], references: [questions.question_id] }),
  sequenceItems: many(sequence_items)
}));

export const sequenceItemsRelations = relations(sequence_items, ({ one }) => ({
  sequenceQuestion: one(sequence_ordering_questions, { fields: [sequence_items.sequence_id], references: [sequence_ordering_questions.sequence_id] })
}));