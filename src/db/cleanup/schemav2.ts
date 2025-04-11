import {
    pgTable,
    serial,
    text,
    varchar,
    integer,
    boolean,
    timestamp,
    primaryKey,
    foreignKey,
    jsonb,
    pgEnum,
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
  
  // Added enum for explicit source typing
  export const questionSourceTypeEnum = pgEnum('question_source_type', [
    'PreviousYear',
    'AI Generated',
    'Other', // Added for flexibility
  ]);
  
  // --- Core Tables ---
  
  // Subjects Table (Physics, Chemistry, Botany, Zoology)
  export const subjects = pgTable('subjects', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(), // Physics, Chemistry, Botany, Zoology
    // subject_code: varchar('subject_code', { length: 10 }), // Optional: If needed
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  });
  
  // Topics Table (Hierarchical)
  export const topics = pgTable('topics', {
    id: serial('id').primaryKey(),
    subjectId: integer('subject_id') // Corrected type and added reference
      .notNull()
      .references(() => subjects.id),
    name: varchar('name', { length: 100 }).notNull(),
    parentTopicId: integer('parent_topic_id').references(():any => topics.id), // Self-reference for hierarchy
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  });
  
  // Subtopics Table
  export const subtopics = pgTable('subtopics', {
    id: serial('id').primaryKey(),
    topicId: integer('topic_id') // Links to parent topic
      .notNull()
      .references(() => topics.id),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  });
  
  // Exam Years Table (Optional but kept for potential future metadata)
  export const examYears = pgTable('exam_years', {
    id: serial('id').primaryKey(),
    year: integer('year').notNull().unique(),
    description: text('description'), // e.g., "NEET Phase 1"
    isActive: boolean('is_active').default(true),
  });
  
  // Question Papers Table (Linked to Subjects and ExamYears)
  export const questionPapers = pgTable('question_papers', {
    id: serial('id').primaryKey(),
    examYearId: integer('exam_year_id') // Link to exam year
      .notNull()
      .references(() => examYears.id),
    subjectId: integer('subject_id') // Link to subject (Physics, Chem, Botany, Zoology)
      .notNull()
      .references(() => subjects.id),
    paperCode: varchar('paper_code', { length: 20 }), // e.g., "F6", "T2"
    totalQuestions: integer('total_questions'),
    maxMarks: integer('max_marks'),
    timeDurationMinutes: integer('time_duration_minutes'),
    sourceDescription: text('source_description'), // Keep generic source info if needed
    uploadDate: timestamp('upload_date').defaultNow(),
    isActive: boolean('is_active').default(true),
  });
  
  // Questions Table (Main table linking everything)
  export const questions = pgTable('questions', {
    id: serial('id').primaryKey(),
    questionPaperId: integer('question_paper_id') // Link to the specific paper
      .references(() => questionPapers.id), // Can be nullable if question isn't from specific paper
    subjectId: integer('subject_id') // Direct link to subject for easier filtering
       .notNull()
       .references(() => subjects.id),
    topicId: integer('topic_id') // Direct link to topic
      .notNull()
      .references(() => topics.id),
    subtopicId: integer('subtopic_id') // Direct link to subtopic (optional)
      .references(() => subtopics.id),
    questionNumber: integer('question_number'), // Optional: Number within a specific paper
    questionType: questionTypeEnum('question_type').notNull(),
    sourceType: questionSourceTypeEnum('source_type').notNull(), // Explicit source type
    questionText: text('question_text').notNull(),
    explanation: text('explanation'), // Explanation for the correct answer
    difficultyLevel: varchar('difficulty_level', { length: 20 }).default('medium'), // e.g., easy, medium, hard
    marks: integer('marks').default(4), // Default NEET marks
    negativeMarks: integer('negative_marks').default(1), // Default NEET negative marks
    isImageBased: boolean('is_image_based').default(false),
    imageUrl: varchar('image_url', { length: 255 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  });
  
  // --- Question Type Specific Detail Tables (Store structure, not correctness) ---
  
  // Options for MultipleChoice Questions
  export const mcqOptions = pgTable('mcq_options', {
    id: serial('id').primaryKey(),
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    optionNumber: integer('option_number'), // e.g., 1, 2, 3, 4
    optionText: text('option_text').notNull(),
    // isCorrect removed -> moved to centralized answers table
  });
  
  // Details for Assertion/Reason Questions
  export const assertionReasonDetails = pgTable('assertion_reason_details', {
    id: serial('id').primaryKey(),
    questionId: integer('question_id')
      .notNull()
      .unique() // One entry per A/R question
      .references(() => questions.id, { onDelete: 'cascade' }),
    assertionText: text('assertion_text').notNull(),
    reasonText: text('reason_text').notNull(),
    // correct_option removed -> moved to centralized answers table
  });
  
  // Structure for Matching Questions
  export const matchingDetails = pgTable('matching_details', {
    id: serial('id').primaryKey(),
    questionId: integer('question_id')
      .notNull()
      .unique() // One entry per matching question
      .references(() => questions.id, { onDelete: 'cascade' }),
    leftColumnHeader: text('left_column_header'), // Optional header (e.g., "List I")
    rightColumnHeader: text('right_column_header'), // Optional header (e.g., "List II")
  });
  
  // Items within a Matching Question
  export const matchingItems = pgTable('matching_items', {
    id: serial('id').primaryKey(),
    matchingDetailId: integer('matching_detail_id') // Link to the parent matching question structure
      .notNull()
      .references(() => matchingDetails.id, { onDelete: 'cascade' }),
    leftItemLabel: varchar('left_item_label', { length: 10 }).notNull(), // e.g., "A", "B", "i", "ii"
    leftItemText: text('left_item_text').notNull(),
    rightItemLabel: varchar('right_item_label', { length: 10 }).notNull(), // e.g., "1", "2", "iii", "iv"
    rightItemText: text('right_item_text').notNull(),
    // Correctness defined in centralized answers table
  });
  
  // Structure for Statement-Based Questions (Multiple Correct / Sequence Ordering)
  export const statementDetails = pgTable('statement_details', {
    id: serial('id').primaryKey(),
    questionId: integer('question_id')
      .notNull()
      .unique() // One entry per statement-based question
      .references(() => questions.id, { onDelete: 'cascade' }),
    introText: text('intro_text'), // e.g., "Read the following statements:"
  });
  
  // Individual Statements for a Question
  export const statements = pgTable('statements', {
    id: serial('id').primaryKey(),
    statementDetailId: integer('statement_detail_id') // Link to parent statement question structure
      .notNull()
      .references(() => statementDetails.id, { onDelete: 'cascade' }),
    statementLabel: varchar('statement_label', {length: 10}), // e.g., "A", "B", "i", "ii"
    statementText: text('statement_text').notNull(),
    // isCorrect removed -> moved to centralized answers table
  });
  
  // --- Centralized Answers Table (Using JSONB) ---
  export const answers = pgTable('answers', {
      id: serial('id').primaryKey(),
      questionId: integer('question_id')
          .notNull()
          .unique() // Each question has one answer entry
          .references(() => questions.id, { onDelete: 'cascade' }),
      // JSONB storing answers based on questionType:
      // - MultipleChoice: { "correctOptionId": mcqOptions.id }
      // - Matching: { "correctMatches": [ { "leftLabel": "A", "rightLabel": "iii" }, {"leftLabel": "B", "rightLabel": "i"} ] }
      // - MultipleCorrectStatements: { "correctStatementIds": [statements.id, statements.id, ...] }
      // - AssertionReason: { "correctExplanationType": 1 } // e.g., 1=Both True, R explains A; 2=Both True, R not explains A; etc.
      // - SequenceOrdering: { "correctSequence": [statements.id, statements.id, ...] } // Ordered array of statement IDs
      // - DiagramBased (if MCQ): { "correctOptionId": mcqOptions.id }
      correctAnswerData: jsonb('correct_answer_data').notNull(),
      // Explanation moved to the main 'questions' table
      createdAt: timestamp('created_at').defaultNow(),
      updatedAt: timestamp('updated_at').defaultNow(),
  });
  
  
  // --- Tags ---
  export const tags = pgTable('tags', {
    id: serial('id').primaryKey(),
    name: varchar('tag_name', { length: 50 }).notNull().unique(),
  });
  
  export const questionTags = pgTable('question_tags', {
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  }, (table) => {
    return {
      pk: primaryKey({ columns: [table.questionId, table.tagId] }), // Composite primary key
    };
  });
  
  
  // --- Relations (Define using Drizzle `relations`) ---
  // (Define relations similar to previous examples, ensuring they match the updated table/column names and structure)
  // Example for key relations:
  export const subjectsRelations = relations(subjects, ({ many }) => ({
      topics: many(topics),
      questionPapers: many(questionPapers),
      questions: many(questions), // Direct questions link
  }));
  
  export const topicsRelations = relations(topics, ({ one, many }) => ({
      subject: one(subjects, { fields: [topics.subjectId], references: [subjects.id] }),
      parentTopic: one(topics, { fields: [topics.parentTopicId], references: [topics.id], relationName: 'parentTopic' }),
      childTopics: many(topics, { relationName: 'parentTopic' }),
      subtopics: many(subtopics),
      questions: many(questions), // Questions directly under this topic
  }));
  
  export const subtopicsRelations = relations(subtopics, ({ one, many }) => ({
      topic: one(topics, { fields: [subtopics.topicId], references: [topics.id] }),
      questions: many(questions), // Questions directly under this subtopic
  }));
  
  export const questionPapersRelations = relations(questionPapers, ({ one, many }) => ({
      examYear: one(examYears, { fields: [questionPapers.examYearId], references: [examYears.id] }),
      subject: one(subjects, { fields: [questionPapers.subjectId], references: [subjects.id] }),
      questions: many(questions), // Questions belonging to this specific paper
  }));
  
  export const questionsRelations = relations(questions, ({ one, many }) => ({
      questionPaper: one(questionPapers, { fields: [questions.questionPaperId], references: [questionPapers.id] }),
      subject: one(subjects, { fields: [questions.subjectId], references: [subjects.id] }),
      topic: one(topics, { fields: [questions.topicId], references: [topics.id] }),
      subtopic: one(subtopics, { fields: [questions.subtopicId], references: [subtopics.id] }),
      mcqOptions: many(mcqOptions),
      assertionReasonDetail: one(assertionReasonDetails, { fields: [questions.id], references: [assertionReasonDetails.questionId] }),
      matchingDetail: one(matchingDetails, { fields: [questions.id], references: [matchingDetails.questionId] }),
      statementDetail: one(statementDetails, { fields: [questions.id], references: [statementDetails.questionId] }),
      answer: one(answers, { fields: [questions.id], references: [answers.questionId] }),
      questionTags: many(questionTags),
  }));
  
  export const mcqOptionsRelations = relations(mcqOptions, ({ one }) => ({
      question: one(questions, { fields: [mcqOptions.questionId], references: [questions.id] }),
  }));
  
  export const assertionReasonDetailsRelations = relations(assertionReasonDetails, ({ one }) => ({
      question: one(questions, { fields: [assertionReasonDetails.questionId], references: [questions.id] }),
  }));
  
  export const matchingDetailsRelations = relations(matchingDetails, ({ one, many }) => ({
      question: one(questions, { fields: [matchingDetails.questionId], references: [questions.id] }),
      items: many(matchingItems),
  }));
  
  export const matchingItemsRelations = relations(matchingItems, ({ one }) => ({
      matchingDetail: one(matchingDetails, { fields: [matchingItems.matchingDetailId], references: [matchingDetails.id] }),
  }));
  
  export const statementDetailsRelations = relations(statementDetails, ({ one, many }) => ({
      question: one(questions, { fields: [statementDetails.questionId], references: [questions.id] }),
      statements: many(statements),
  }));
  
  export const statementsRelations = relations(statements, ({ one }) => ({
      statementDetail: one(statementDetails, { fields: [statements.statementDetailId], references: [statementDetails.id] }),
  }));
  
  export const answersRelations = relations(answers, ({ one }) => ({
      question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
  }));
  
  export const tagsRelations = relations(tags, ({ many }) => ({
      questionTags: many(questionTags),
  }));
  
  export const questionTagsRelations = relations(questionTags, ({ one }) => ({
      question: one(questions, { fields: [questionTags.questionId], references: [questions.id] }),
      tag: one(tags, { fields: [questionTags.tagId], references: [tags.id] }),
  }));