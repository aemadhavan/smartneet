CREATE TYPE "public"."difficulty_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."question_source_type" AS ENUM('PreviousYear', 'AI_Generated', 'Other');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('MultipleChoice', 'Matching', 'MultipleCorrectStatements', 'AssertionReason', 'DiagramBased', 'SequenceOrdering');--> statement-breakpoint
ALTER TABLE "question_papers" RENAME COLUMN "paper_year" TO "exam_year_id";--> statement-breakpoint
ALTER TABLE "question_papers" RENAME COLUMN "subject" TO "subject_id";--> statement-breakpoint
ALTER TABLE "question_papers" RENAME COLUMN "source" TO "source_description";--> statement-breakpoint
ALTER TABLE "statements" RENAME COLUMN "question_id" TO "statement_based_id";--> statement-breakpoint
ALTER TABLE "assertion_reason_questions" DROP CONSTRAINT "assertion_reason_questions_question_id_questions_question_id_fk";
--> statement-breakpoint
ALTER TABLE "match_columns_items" DROP CONSTRAINT "match_columns_items_match_id_match_columns_questions_match_id_fk";
--> statement-breakpoint
ALTER TABLE "match_columns_options" DROP CONSTRAINT "match_columns_options_match_id_match_columns_questions_match_id_fk";
--> statement-breakpoint
ALTER TABLE "match_columns_questions" DROP CONSTRAINT "match_columns_questions_question_id_questions_question_id_fk";
--> statement-breakpoint
ALTER TABLE "multiple_choice_options" DROP CONSTRAINT "multiple_choice_options_question_id_questions_question_id_fk";
--> statement-breakpoint
ALTER TABLE "question_tags" DROP CONSTRAINT "question_tags_question_id_questions_question_id_fk";
--> statement-breakpoint
ALTER TABLE "question_tags" DROP CONSTRAINT "question_tags_tag_id_tags_tag_id_fk";
--> statement-breakpoint
ALTER TABLE "statement_based_questions" DROP CONSTRAINT "statement_based_questions_question_id_questions_question_id_fk";
--> statement-breakpoint
ALTER TABLE "statements" DROP CONSTRAINT "statements_question_id_questions_question_id_fk";
--> statement-breakpoint
ALTER TABLE "multiple_choice_options" ALTER COLUMN "question_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "question_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "topic_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "question_type" SET DATA TYPE question_type;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "difficulty_level" SET DATA TYPE difficulty_level;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "marks" SET DEFAULT 4;--> statement-breakpoint
ALTER TABLE "subtopics" ALTER COLUMN "topic_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "subject_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "exam_years" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "exam_years" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "exam_years" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "question_papers" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "question_papers" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "question_papers" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "subject_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "source_type" "question_source_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "negative_marks" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "statements" ADD COLUMN "statement_label" varchar(10);--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "subtopics" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "assertion_reason_questions" ADD CONSTRAINT "assertion_reason_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_columns_items" ADD CONSTRAINT "match_columns_items_match_id_match_columns_questions_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match_columns_questions"("match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_columns_options" ADD CONSTRAINT "match_columns_options_match_id_match_columns_questions_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match_columns_questions"("match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_columns_questions" ADD CONSTRAINT "match_columns_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multiple_choice_options" ADD CONSTRAINT "multiple_choice_options_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_exam_year_id_exam_years_year_id_fk" FOREIGN KEY ("exam_year_id") REFERENCES "public"."exam_years"("year_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_based_questions" ADD CONSTRAINT "statement_based_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_statement_based_id_statement_based_questions_statement_id_fk" FOREIGN KEY ("statement_based_id") REFERENCES "public"."statement_based_questions"("statement_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_papers" DROP COLUMN "section";--> statement-breakpoint
ALTER TABLE "exam_years" ADD CONSTRAINT "exam_years_exam_year_unique" UNIQUE("exam_year");