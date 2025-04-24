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
  jsonb,
  json,
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

// New enum for session types
export const sessionTypeEnum = pgEnum('session_type', [
  'Practice',
  'Test',
  'Review',
  'Custom'
]);

// New enum for mastery levels
export const masteryLevelEnum = pgEnum('mastery_level', [
  'notStarted',
  'beginner',
  'intermediate',
  'advanced',
  'mastered'
]);

// New enum for subscription plans
export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'free',
  'premium',
  'institutional'
]);

// New enum for subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'unpaid',
  'trialing',
  'incomplete',
  'incomplete_expired'
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
  is_image_based: boolean('is_image_based').default(false),
  image_url: varchar('image_url', { length: 255 }),
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

// --- User Management Tables --- 

export const practice_sessions = pgTable('practice_sessions', {
  session_id: serial('session_id').primaryKey(),
  user_id: varchar('user_id', { length: 50 }).notNull(), // Clerk user ID
  session_type: sessionTypeEnum('session_type').notNull(),
  subject_id: integer('subject_id').references(() => subjects.subject_id),
  topic_id: integer('topic_id').references(() => topics.topic_id),
  subtopic_id: integer('subtopic_id').references(() => subtopics.subtopic_id),
  start_time: timestamp('start_time').notNull().defaultNow(),
  end_time: timestamp('end_time'),
  duration_minutes: integer('duration_minutes'),
  total_questions: integer('total_questions'),
  questions_attempted: integer('questions_attempted'),
  questions_correct: integer('questions_correct'),
  score: integer('score'),
  max_score: integer('max_score'),
  is_completed: boolean('is_completed').default(false),
  notes: text('notes'),
  settings: jsonb('settings'), // Store session configurations
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const session_questions = pgTable('session_questions', {
  session_question_id: serial('session_question_id').primaryKey(),
  session_id: integer('session_id').notNull().references(() => practice_sessions.session_id, { onDelete: 'cascade' }),
  question_id: integer('question_id').notNull().references(() => questions.question_id),
  question_order: integer('question_order').notNull(),
  time_spent_seconds: integer('time_spent_seconds'),
  is_bookmarked: boolean('is_bookmarked').default(false),
  user_id: varchar('user_id', { length: 50 }).notNull(), // Clerk user ID
  topic_id: integer('topic_id').notNull().references(() => topics.topic_id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    uniqueSessionQuestion: uniqueIndex('unique_session_question_idx_sq').on(table.session_id, table.question_id)
  };
});

export const question_attempts = pgTable('question_attempts', {
  attempt_id: serial('attempt_id').primaryKey(),
  user_id: varchar('user_id', { length: 50 }).notNull(), // Clerk user ID
  question_id: integer('question_id').notNull().references(() => questions.question_id),
  session_id: integer('session_id').references(() => practice_sessions.session_id),
  session_question_id: integer('session_question_id').references(() => session_questions.session_question_id),
  attempt_number: integer('attempt_number').notNull().default(1),
  user_answer: jsonb('user_answer').notNull(), // Store answer in flexible format
  is_correct: boolean('is_correct').notNull(),
  time_taken_seconds: integer('time_taken_seconds'),
  marks_awarded: integer('marks_awarded'),
  review_flag: boolean('review_flag').default(false),
  user_notes: text('user_notes'),
  attempt_timestamp: timestamp('attempt_timestamp').notNull().defaultNow(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Fixed topic_mastery table - removed duplicate references and fixed unique index
export const topic_mastery = pgTable('topic_mastery', {
  mastery_id: serial('mastery_id').primaryKey(),
  user_id: varchar('user_id', { length: 50 }).notNull(), // Clerk user ID
  topic_id: integer('topic_id').notNull().references(() => topics.topic_id),
  session_id: integer('session_id').references(() => practice_sessions.session_id),
  question_id: integer('question_id').references(() => questions.question_id),
  mastery_level: masteryLevelEnum('mastery_level').notNull().default('notStarted'),
  questions_attempted: integer('questions_attempted').notNull().default(0),
  questions_correct: integer('questions_correct').notNull().default(0),
  accuracy_percentage: integer('accuracy_percentage'),
  last_practiced: timestamp('last_practiced'),
  streak_count: integer('streak_count').default(0),
  progress_data: jsonb('progress_data'), // Store detailed progress metrics
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    uniqueTopicMastery: uniqueIndex('unique_topic_mastery_idx').on(table.user_id, table.topic_id)
  };
});

// --- Subscription Management Tables ---
// Add subscription plans table
export const subscription_plans = pgTable('subscription_plans', {
  plan_id: serial('plan_id').primaryKey(),
  plan_name: varchar('plan_name', { length: 50 }).notNull(),
  plan_code: subscriptionPlanEnum('plan_code').notNull(),
  description: varchar('description', { length: 255 }),
  price_inr: integer('price_inr').notNull(),
  price_id_stripe: varchar('price_id_stripe', { length: 100 }).notNull(),
  product_id_stripe: varchar('product_id_stripe', { length: 100 }).notNull(),
  features: json('features'), // JSON array of features for this plan
  test_limit_daily: integer('test_limit_daily'), // Null for unlimited
  duration_days: integer('duration_days').notNull(), // e.g., 30, 90, 365
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Add user subscriptions table
export const user_subscriptions = pgTable('user_subscriptions', {
  subscription_id: serial('subscription_id').primaryKey(),
  user_id: varchar('user_id', { length: 50 }).notNull(), // Clerk user ID
  plan_id: integer('plan_id').notNull().references(() => subscription_plans.plan_id),
  stripe_subscription_id: varchar('stripe_subscription_id', { length: 100 }),
  stripe_customer_id: varchar('stripe_customer_id', { length: 100 }),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  current_period_start: timestamp('current_period_start').notNull(),
  current_period_end: timestamp('current_period_end').notNull(),
  cancel_at_period_end: boolean('cancel_at_period_end').default(false),
  canceled_at: timestamp('canceled_at'),
  trial_end: timestamp('trial_end'),
  tests_used_today: integer('tests_used_today').default(0),
  tests_used_total: integer('tests_used_total').default(0),
  last_test_date: timestamp('last_test_date'),
  metadata: json('metadata'), // Additional metadata as needed
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    userIdIdx: uniqueIndex('user_subscriptions_user_id_idx').on(table.user_id)
  };
});

// Add payment history table
export const payment_history = pgTable('payment_history', {
  payment_id: serial('payment_id').primaryKey(),
  user_id: varchar('user_id', { length: 50 }).notNull(), // Clerk user ID
  subscription_id: integer('subscription_id').references(() => user_subscriptions.subscription_id),
  amount_inr: integer('amount_inr').notNull(),
  stripe_payment_id: varchar('stripe_payment_id', { length: 100 }),
  stripe_invoice_id: varchar('stripe_invoice_id', { length: 100 }),
  payment_method: varchar('payment_method', { length: 50 }),
  payment_status: varchar('payment_status', { length: 50 }).notNull(),
  payment_date: timestamp('payment_date').notNull(),
  next_billing_date: timestamp('next_billing_date'),
  receipt_url: varchar('receipt_url', { length: 255 }),
  gst_details: json('gst_details'), // For storing GST information
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// --- Define Relations ---

export const subjectsRelations = relations(subjects, ({ many }) => ({
  topics: many(topics),
  questionPapers: many(question_papers),
  questions: many(questions),
  practiceSessions: many(practice_sessions)
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, { fields: [topics.subject_id], references: [subjects.subject_id] }),
  parentTopic: one(topics, { fields: [topics.parent_topic_id], references: [topics.topic_id], relationName: 'parentTopic' }),
  childTopics: many(topics, { relationName: 'parentTopic' }),
  subtopics: many(subtopics),
  questions: many(questions),
  practiceSessions: many(practice_sessions),
  topicMastery: many(topic_mastery)
}));

export const subtopicsRelations = relations(subtopics, ({ one, many }) => ({
  topic: one(topics, { fields: [subtopics.topic_id], references: [topics.topic_id] }),
  questions: many(questions),
  practiceSessions: many(practice_sessions)
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
  sessionQuestions: many(session_questions),
  questionAttempts: many(question_attempts)
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  questionTags: many(question_tags)
}));

export const questionTagsRelations = relations(question_tags, ({ one }) => ({
  question: one(questions, { fields: [question_tags.question_id], references: [questions.question_id] }),
  tag: one(tags, { fields: [question_tags.tag_id], references: [tags.tag_id] })
}));

// --- User Management Relations ---

export const practiceSessionsRelations = relations(practice_sessions, ({ one, many }) => ({
  subject: one(subjects, { fields: [practice_sessions.subject_id], references: [subjects.subject_id] }),
  topic: one(topics, { fields: [practice_sessions.topic_id], references: [topics.topic_id] }),
  subtopic: one(subtopics, { fields: [practice_sessions.subtopic_id], references: [subtopics.subtopic_id] }),
  sessionQuestions: many(session_questions),
  questionAttempts: many(question_attempts)
}));

export const sessionQuestionsRelations = relations(session_questions, ({ one, many }) => ({
  session: one(practice_sessions, { fields: [session_questions.session_id], references: [practice_sessions.session_id] }),
  question: one(questions, { fields: [session_questions.question_id], references: [questions.question_id] }),
  questionAttempts: many(question_attempts)
}));

export const questionAttemptsRelations = relations(question_attempts, ({ one }) => ({
  question: one(questions, { fields: [question_attempts.question_id], references: [questions.question_id] }),
  session: one(practice_sessions, { fields: [question_attempts.session_id], references: [practice_sessions.session_id] }),
  sessionQuestion: one(session_questions, { fields: [question_attempts.session_question_id], references: [session_questions.session_question_id] })
}));

export const topicMasteryRelations = relations(topic_mastery, ({ one }) => ({
  topic: one(topics, { fields: [topic_mastery.topic_id], references: [topics.topic_id] }),
  session: one(practice_sessions, { fields: [topic_mastery.session_id], references: [practice_sessions.session_id] }),
  question: one(questions, { fields: [topic_mastery.question_id], references: [questions.question_id] })
}));

// Add relations related to subscription management
export const subscriptionPlansRelations = relations(subscription_plans, ({ many }) => ({
  userSubscriptions: many(user_subscriptions)
}));

export const userSubscriptionsRelations = relations(user_subscriptions, ({ one, many }) => ({
  plan: one(subscription_plans, { fields: [user_subscriptions.plan_id], references: [subscription_plans.plan_id] }),
  payments: many(payment_history)
}));

export const paymentHistoryRelations = relations(payment_history, ({ one }) => ({
  subscription: one(user_subscriptions, { fields: [payment_history.subscription_id], references: [user_subscriptions.subscription_id] })
}));
