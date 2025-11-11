import { pgTable, unique, integer, text, boolean, timestamp, foreignKey, varchar, json, jsonb, real, uniqueIndex, primaryKey, pgSequence, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const difficultyLevel = pgEnum("difficulty_level", ['easy', 'medium', 'hard'])
export const masteryLevel = pgEnum("mastery_level", ['notStarted', 'beginner', 'intermediate', 'advanced', 'mastered'])
export const questionSourceType = pgEnum("question_source_type", ['PreviousYear', 'AI_Generated', 'Other'])
export const questionType = pgEnum("question_type", ['MultipleChoice', 'Matching', 'MultipleCorrectStatements', 'AssertionReason', 'DiagramBased', 'SequenceOrdering'])
export const sessionType = pgEnum("session_type", ['Practice', 'Test', 'Review', 'Custom'])
export const subscriptionPlan = pgEnum("subscription_plan", ['free', 'premium', 'institutional'])
export const subscriptionStatus = pgEnum("subscription_status", ['active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired'])

export const examYearsYearIdSeq = pgSequence("exam_years_year_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const paymentHistoryPaymentIdSeq = pgSequence("payment_history_payment_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const practiceSessionsSessionIdSeq = pgSequence("practice_sessions_session_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const questionAttemptsAttemptIdSeq = pgSequence("question_attempts_attempt_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const questionPapersPaperIdSeq = pgSequence("question_papers_paper_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const questionsQuestionIdSeq = pgSequence("questions_question_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const sessionQuestionsSessionQuestionIdSeq = pgSequence("session_questions_session_question_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const subjectsSubjectIdSeq = pgSequence("subjects_subject_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const subscriptionPlansPlanIdSeq = pgSequence("subscription_plans_plan_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const subtopicsSubtopicIdSeq = pgSequence("subtopics_subtopic_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const tagsTagIdSeq = pgSequence("tags_tag_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const topicMasteryMasteryIdSeq = pgSequence("topic_mastery_mastery_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const topicsTopicIdSeq = pgSequence("topics_topic_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const userSubscriptionsSubscriptionIdSeq = pgSequence("user_subscriptions_subscription_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })

export const examYears = pgTable("exam_years", {
	yearId: integer("year_id").default(sql`nextval('exam_years_year_id_seq'::regclass)`).primaryKey().notNull(),
	examYear: integer("exam_year").notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("exam_years_exam_year_key").on(table.examYear),
]);

export const paymentHistory = pgTable("payment_history", {
	paymentId: integer("payment_id").default(sql`nextval('payment_history_payment_id_seq'::regclass)`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 50 }).notNull(),
	subscriptionId: integer("subscription_id"),
	amountInr: integer("amount_inr").notNull(),
	stripePaymentId: varchar("stripe_payment_id", { length: 100 }),
	stripeInvoiceId: varchar("stripe_invoice_id", { length: 100 }),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentStatus: varchar("payment_status", { length: 50 }).notNull(),
	paymentDate: timestamp("payment_date", { mode: 'string' }).notNull(),
	nextBillingDate: timestamp("next_billing_date", { mode: 'string' }),
	receiptUrl: varchar("receipt_url", { length: 255 }),
	gstDetails: json("gst_details"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [userSubscriptions.subscriptionId],
			name: "payment_history_subscription_id_fkey"
		}),
]);

export const practiceSessions = pgTable("practice_sessions", {
	sessionId: integer("session_id").default(sql`nextval('practice_sessions_session_id_seq'::regclass)`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 50 }).notNull(),
	sessionType: sessionType("session_type").notNull(),
	subjectId: integer("subject_id"),
	topicId: integer("topic_id"),
	subtopicId: integer("subtopic_id"),
	startTime: timestamp("start_time", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }),
	durationMinutes: integer("duration_minutes"),
	totalQuestions: integer("total_questions"),
	questionsAttempted: integer("questions_attempted"),
	questionsCorrect: integer("questions_correct"),
	score: integer(),
	maxScore: integer("max_score"),
	isCompleted: boolean("is_completed").default(false),
	notes: text(),
	settings: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.subjectId],
			name: "practice_sessions_subject_id_fkey"
		}),
	foreignKey({
			columns: [table.subtopicId],
			foreignColumns: [subtopics.subtopicId],
			name: "practice_sessions_subtopic_id_fkey"
		}),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.topicId],
			name: "practice_sessions_topic_id_fkey"
		}),
]);

export const questionAttempts = pgTable("question_attempts", {
	attemptId: integer("attempt_id").default(sql`nextval('question_attempts_attempt_id_seq'::regclass)`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 50 }).notNull(),
	questionId: integer("question_id").notNull(),
	sessionId: integer("session_id"),
	sessionQuestionId: integer("session_question_id"),
	attemptNumber: integer("attempt_number").default(1).notNull(),
	userAnswer: jsonb("user_answer").notNull(),
	isCorrect: boolean("is_correct").notNull(),
	timeTakenSeconds: integer("time_taken_seconds"),
	marksAwarded: integer("marks_awarded"),
	reviewFlag: boolean("review_flag").default(false),
	userNotes: text("user_notes"),
	attemptTimestamp: timestamp("attempt_timestamp", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.questionId],
			name: "question_attempts_question_id_fkey"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [practiceSessions.sessionId],
			name: "question_attempts_session_id_fkey"
		}),
	foreignKey({
			columns: [table.sessionQuestionId],
			foreignColumns: [sessionQuestions.sessionQuestionId],
			name: "question_attempts_session_question_id_fkey"
		}),
]);

export const questionPapers = pgTable("question_papers", {
	paperId: integer("paper_id").default(sql`nextval('question_papers_paper_id_seq'::regclass)`).primaryKey().notNull(),
	examYearId: integer("exam_year_id").notNull(),
	subjectId: integer("subject_id").notNull(),
	paperCode: varchar("paper_code", { length: 20 }),
	totalQuestions: integer("total_questions"),
	maxMarks: integer("max_marks"),
	timeDurationMinutes: integer("time_duration_minutes"),
	sourceDescription: text("source_description"),
	uploadDate: timestamp("upload_date", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.examYearId],
			foreignColumns: [examYears.yearId],
			name: "question_papers_exam_year_id_fkey"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.subjectId],
			name: "question_papers_subject_id_fkey"
		}),
]);

export const questions = pgTable("questions", {
	questionId: integer("question_id").default(sql`nextval('questions_question_id_seq'::regclass)`).primaryKey().notNull(),
	paperId: integer("paper_id"),
	subjectId: integer("subject_id").notNull(),
	topicId: integer("topic_id").notNull(),
	subtopicId: integer("subtopic_id"),
	questionNumber: real("question_number"),
	questionType: questionType("question_type").notNull(),
	sourceType: questionSourceType("source_type").notNull(),
	questionText: text("question_text").notNull(),
	explanation: text(),
	details: jsonb().notNull(),
	difficultyLevel: difficultyLevel("difficulty_level").default('medium'),
	marks: integer().default(4),
	negativeMarks: integer("negative_marks").default(1),
	isImageBased: boolean("is_image_based").default(false),
	imageUrl: varchar("image_url", { length: 255 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.paperId],
			foreignColumns: [questionPapers.paperId],
			name: "questions_paper_id_fkey"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.subjectId],
			name: "questions_subject_id_fkey"
		}),
	foreignKey({
			columns: [table.subtopicId],
			foreignColumns: [subtopics.subtopicId],
			name: "questions_subtopic_id_fkey"
		}),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.topicId],
			name: "questions_topic_id_fkey"
		}),
]);

export const questionsBackup = pgTable("questions_backup", {
	questionId: integer("question_id"),
	paperId: integer("paper_id"),
	subjectId: integer("subject_id"),
	topicId: integer("topic_id"),
	subtopicId: integer("subtopic_id"),
	questionNumber: real("question_number"),
	questionType: questionType("question_type"),
	sourceType: questionSourceType("source_type"),
	questionText: text("question_text"),
	explanation: text(),
	details: jsonb(),
	difficultyLevel: difficultyLevel("difficulty_level"),
	marks: integer(),
	negativeMarks: integer("negative_marks"),
	isImageBased: boolean("is_image_based"),
	imageUrl: varchar("image_url", { length: 255 }),
	isActive: boolean("is_active"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const sessionQuestions = pgTable("session_questions", {
	sessionQuestionId: integer("session_question_id").default(sql`nextval('session_questions_session_question_id_seq'::regclass)`).primaryKey().notNull(),
	sessionId: integer("session_id").notNull(),
	questionId: integer("question_id").notNull(),
	questionOrder: integer("question_order").notNull(),
	timeSpentSeconds: integer("time_spent_seconds"),
	isBookmarked: boolean("is_bookmarked").default(false),
	userId: varchar("user_id", { length: 50 }).notNull(),
	topicId: integer("topic_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	uniqueIndex("unique_session_question_idx_sq").using("btree", table.sessionId.asc().nullsLast().op("int4_ops"), table.questionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.questionId],
			name: "session_questions_question_id_fkey"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [practiceSessions.sessionId],
			name: "session_questions_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.topicId],
			name: "session_questions_topic_id_fkey"
		}),
]);

export const subjects = pgTable("subjects", {
	subjectId: integer("subject_id").default(sql`nextval('subjects_subject_id_seq'::regclass)`).primaryKey().notNull(),
	subjectName: varchar("subject_name", { length: 50 }).notNull(),
	subjectCode: varchar("subject_code", { length: 10 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const subscriptionPlans = pgTable("subscription_plans", {
	planId: integer("plan_id").default(sql`nextval('subscription_plans_plan_id_seq'::regclass)`).primaryKey().notNull(),
	planName: varchar("plan_name", { length: 50 }).notNull(),
	planCode: subscriptionPlan("plan_code").notNull(),
	description: varchar({ length: 255 }),
	priceInr: integer("price_inr").notNull(),
	priceIdStripe: varchar("price_id_stripe", { length: 100 }).notNull(),
	productIdStripe: varchar("product_id_stripe", { length: 100 }).notNull(),
	features: json(),
	testLimitDaily: integer("test_limit_daily"),
	durationDays: integer("duration_days").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const subtopics = pgTable("subtopics", {
	subtopicId: integer("subtopic_id").default(sql`nextval('subtopics_subtopic_id_seq'::regclass)`).primaryKey().notNull(),
	topicId: integer("topic_id").notNull(),
	subtopicName: varchar("subtopic_name", { length: 100 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.topicId],
			name: "subtopics_topic_id_fkey"
		}),
]);

export const tags = pgTable("tags", {
	tagId: integer("tag_id").default(sql`nextval('tags_tag_id_seq'::regclass)`).primaryKey().notNull(),
	tagName: varchar("tag_name", { length: 50 }).notNull(),
}, (table) => [
	unique("tags_tag_name_key").on(table.tagName),
]);

export const topicMastery = pgTable("topic_mastery", {
	masteryId: integer("mastery_id").default(sql`nextval('topic_mastery_mastery_id_seq'::regclass)`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 50 }).notNull(),
	topicId: integer("topic_id").notNull(),
	sessionId: integer("session_id"),
	questionId: integer("question_id"),
	masteryLevel: masteryLevel("mastery_level").default('notStarted').notNull(),
	questionsAttempted: integer("questions_attempted").default(0).notNull(),
	questionsCorrect: integer("questions_correct").default(0).notNull(),
	accuracyPercentage: integer("accuracy_percentage"),
	lastPracticed: timestamp("last_practiced", { mode: 'string' }),
	streakCount: integer("streak_count").default(0),
	progressData: jsonb("progress_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	uniqueIndex("unique_topic_mastery_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.topicId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.questionId],
			name: "topic_mastery_question_id_fkey"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [practiceSessions.sessionId],
			name: "topic_mastery_session_id_fkey"
		}),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.topicId],
			name: "topic_mastery_topic_id_fkey"
		}),
]);

export const topics = pgTable("topics", {
	topicId: integer("topic_id").default(sql`nextval('topics_topic_id_seq'::regclass)`).primaryKey().notNull(),
	subjectId: integer("subject_id").notNull(),
	topicName: varchar("topic_name", { length: 100 }).notNull(),
	parentTopicId: integer("parent_topic_id"),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.parentTopicId],
			foreignColumns: [table.topicId],
			name: "topics_parent_topic_id_fkey"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.subjectId],
			name: "topics_subject_id_fkey"
		}),
]);

export const userSubscriptions = pgTable("user_subscriptions", {
	subscriptionId: integer("subscription_id").default(sql`nextval('user_subscriptions_subscription_id_seq'::regclass)`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 50 }).notNull(),
	planId: integer("plan_id").notNull(),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
	stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
	status: subscriptionStatus().default('active').notNull(),
	currentPeriodStart: timestamp("current_period_start", { mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }).notNull(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	canceledAt: timestamp("canceled_at", { mode: 'string' }),
	trialEnd: timestamp("trial_end", { mode: 'string' }),
	testsUsedToday: integer("tests_used_today").default(0),
	testsUsedTotal: integer("tests_used_total").default(0),
	lastTestDate: timestamp("last_test_date", { mode: 'string' }),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	uniqueIndex("user_subscriptions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [subscriptionPlans.planId],
			name: "user_subscriptions_plan_id_fkey"
		}),
]);

export const questionTags = pgTable("question_tags", {
	questionId: integer("question_id").notNull(),
	tagId: integer("tag_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.questionId],
			name: "question_tags_question_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.tagId],
			name: "question_tags_tag_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.questionId, table.tagId], name: "question_tags_pkey"}),
]);
