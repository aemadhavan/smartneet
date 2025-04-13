CREATE TYPE "public"."difficulty_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."question_source_type" AS ENUM('PreviousYear', 'AI_Generated', 'Other');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('MultipleChoice', 'Matching', 'MultipleCorrectStatements', 'AssertionReason', 'DiagramBased', 'SequenceOrdering');--> statement-breakpoint
CREATE TABLE "exam_years" (
	"year_id" serial PRIMARY KEY NOT NULL,
	"exam_year" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "exam_years_exam_year_unique" UNIQUE("exam_year")
);
--> statement-breakpoint
CREATE TABLE "question_papers" (
	"paper_id" serial PRIMARY KEY NOT NULL,
	"exam_year_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"paper_code" varchar(20),
	"total_questions" integer,
	"max_marks" integer,
	"time_duration_minutes" integer,
	"source_description" text,
	"upload_date" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_tags" (
	"question_id" integer,
	"tag_id" integer,
	CONSTRAINT "question_tags_question_id_tag_id_pk" PRIMARY KEY("question_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"question_id" serial PRIMARY KEY NOT NULL,
	"paper_id" integer,
	"subject_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	"subtopic_id" integer,
	"question_number" integer,
	"question_type" "question_type" NOT NULL,
	"source_type" "question_source_type" NOT NULL,
	"question_text" text NOT NULL,
	"explanation" text,
	"details" jsonb NOT NULL,
	"difficulty_level" "difficulty_level" DEFAULT 'medium',
	"marks" integer DEFAULT 4,
	"negative_marks" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sequence_items" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"sequence_id" integer NOT NULL,
	"item_number" integer NOT NULL,
	"item_label" varchar(10),
	"item_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequence_ordering_questions" (
	"sequence_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"intro_text" text,
	"correct_sequence" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"subject_id" serial PRIMARY KEY NOT NULL,
	"subject_name" varchar(50) NOT NULL,
	"subject_code" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subtopics" (
	"subtopic_id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"subtopic_name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"tag_id" serial PRIMARY KEY NOT NULL,
	"tag_name" varchar(50) NOT NULL,
	CONSTRAINT "tags_tag_name_unique" UNIQUE("tag_name")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"topic_id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"topic_name" varchar(100) NOT NULL,
	"parent_topic_id" integer,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_exam_year_id_exam_years_year_id_fk" FOREIGN KEY ("exam_year_id") REFERENCES "public"."exam_years"("year_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_id_question_papers_paper_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."question_papers"("paper_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_subtopic_id_subtopics_subtopic_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("subtopic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_items" ADD CONSTRAINT "sequence_items_sequence_id_sequence_ordering_questions_sequence_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequence_ordering_questions"("sequence_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_ordering_questions" ADD CONSTRAINT "sequence_ordering_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_sequence_question_idx" ON "sequence_ordering_questions" USING btree ("question_id");