CREATE TYPE "public"."mastery_level" AS ENUM('notStarted', 'beginner', 'intermediate', 'advanced', 'mastered');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('Practice', 'Test', 'Review', 'Custom');--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"session_type" "session_type" NOT NULL,
	"subject_id" integer,
	"topic_id" integer,
	"subtopic_id" integer,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"duration_minutes" integer,
	"total_questions" integer,
	"questions_attempted" integer,
	"questions_correct" integer,
	"score" integer,
	"max_score" integer,
	"is_completed" boolean DEFAULT false,
	"notes" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_attempts" (
	"attempt_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"question_id" integer NOT NULL,
	"session_id" integer,
	"session_question_id" integer,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"user_answer" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"time_taken_seconds" integer,
	"marks_awarded" integer,
	"review_flag" boolean DEFAULT false,
	"user_notes" text,
	"attempt_timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_questions" (
	"session_question_id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"question_order" integer NOT NULL,
	"time_spent_seconds" integer,
	"is_bookmarked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topic_mastery" (
	"mastery_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"topic_id" integer NOT NULL,
	"mastery_level" "mastery_level" DEFAULT 'notStarted' NOT NULL,
	"questions_attempted" integer DEFAULT 0 NOT NULL,
	"questions_correct" integer DEFAULT 0 NOT NULL,
	"accuracy_percentage" integer,
	"last_practiced" timestamp,
	"streak_count" integer DEFAULT 0,
	"progress_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_subtopic_id_subtopics_subtopic_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("subtopic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_session_id_practice_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_session_question_id_session_questions_session_question_id_fk" FOREIGN KEY ("session_question_id") REFERENCES "public"."session_questions"("session_question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_session_id_practice_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_session_question_idx" ON "session_questions" USING btree ("session_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_topic_idx" ON "topic_mastery" USING btree ("user_id","topic_id");