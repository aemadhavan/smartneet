CREATE TABLE "assertion_reason_questions" (
	"ar_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"assertion_text" text NOT NULL,
	"reason_text" text NOT NULL,
	"correct_option" integer NOT NULL,
	CONSTRAINT "assertion_reason_questions_question_id_unique" UNIQUE("question_id")
);
--> statement-breakpoint
CREATE TABLE "exam_years" (
	"year_id" serial PRIMARY KEY NOT NULL,
	"exam_year" integer NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "match_columns_items" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"match_id" integer,
	"left_item_label" varchar(10) NOT NULL,
	"left_item_text" text NOT NULL,
	"right_item_label" varchar(10) NOT NULL,
	"right_item_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_columns_options" (
	"option_id" serial PRIMARY KEY NOT NULL,
	"match_id" integer,
	"option_number" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "match_columns_questions" (
	"match_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"left_column_header" text,
	"right_column_header" text,
	CONSTRAINT "match_columns_questions_question_id_unique" UNIQUE("question_id")
);
--> statement-breakpoint
CREATE TABLE "multiple_choice_options" (
	"option_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"option_number" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "question_papers" (
	"paper_id" serial PRIMARY KEY NOT NULL,
	"paper_year" integer NOT NULL,
	"paper_code" varchar(20),
	"subject" varchar(50) NOT NULL,
	"section" varchar(10),
	"total_questions" integer,
	"max_marks" integer,
	"time_duration_minutes" integer,
	"source" varchar(100),
	"upload_date" timestamp DEFAULT now()
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
	"question_number" integer NOT NULL,
	"topic_id" integer,
	"subtopic_id" integer,
	"question_type" varchar(50) NOT NULL,
	"question_text" text NOT NULL,
	"explanation" text,
	"difficulty_level" varchar(20) DEFAULT 'medium',
	"marks" integer DEFAULT 1,
	"is_image_based" boolean DEFAULT false,
	"image_url" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "statement_based_questions" (
	"statement_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"intro_text" text,
	"correct_option" integer NOT NULL,
	CONSTRAINT "statement_based_questions_question_id_unique" UNIQUE("question_id")
);
--> statement-breakpoint
CREATE TABLE "statements" (
	"statement_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"statement_number" integer NOT NULL,
	"statement_text" text NOT NULL,
	"is_correct" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "subtopics" (
	"subtopic_id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer,
	"subtopic_name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"tag_id" serial PRIMARY KEY NOT NULL,
	"tag_name" varchar(50) NOT NULL,
	CONSTRAINT "tags_tag_name_unique" UNIQUE("tag_name")
);
--> statement-breakpoint
ALTER TABLE "topics" DROP CONSTRAINT "topics_subject_id_subjects_subject_id_fk";
--> statement-breakpoint
ALTER TABLE "topics" DROP CONSTRAINT "topics_parent_topic_id_topics_topic_id_fk";
--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "subject_id" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "subject_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "assertion_reason_questions" ADD CONSTRAINT "assertion_reason_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_columns_items" ADD CONSTRAINT "match_columns_items_match_id_match_columns_questions_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match_columns_questions"("match_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_columns_options" ADD CONSTRAINT "match_columns_options_match_id_match_columns_questions_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match_columns_questions"("match_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_columns_questions" ADD CONSTRAINT "match_columns_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multiple_choice_options" ADD CONSTRAINT "multiple_choice_options_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_id_question_papers_paper_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."question_papers"("paper_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_subtopic_id_subtopics_subtopic_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("subtopic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_based_questions" ADD CONSTRAINT "statement_based_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" DROP COLUMN "topic_description";--> statement-breakpoint
ALTER TABLE "topics" DROP COLUMN "topic_order";