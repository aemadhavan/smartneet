-- Drop indexes first
DROP INDEX IF EXISTS "unique_session_question_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "unique_user_topic_idx";--> statement-breakpoint

-- Step 1: Add columns allowing NULL initially
ALTER TABLE "session_questions" ADD COLUMN "user_id" varchar(50);--> statement-breakpoint
ALTER TABLE "session_questions" ADD COLUMN "topic_id" integer;--> statement-breakpoint

-- Step 2: Update existing data with default values
-- Set user_id to a default value
UPDATE "session_questions" SET "user_id" = '"user_2vLUBkfrAyG5ZXdYiqMrQWBfyaJ"';--> statement-breakpoint

-- Update topic_id from the questions table if possible
UPDATE "session_questions" sq
SET "topic_id" = q."topic_id"
FROM "questions" q
WHERE sq."question_id" = q."question_id";--> statement-breakpoint

-- Fallback for any rows that still have NULL topic_id
UPDATE "session_questions" 
SET "topic_id" = 1
WHERE "topic_id" IS NULL;--> statement-breakpoint

-- Step 3: Fix duplicate user_id/topic_id combinations
-- This adds a suffix to make each user_id unique within the same topic
UPDATE "session_questions" sq1
SET "user_id" = sq1."user_id" || '_' || sq1."session_question_id"
WHERE EXISTS (
    SELECT 1 FROM "session_questions" sq2
    WHERE sq2."topic_id" = sq1."topic_id"
    AND sq2."user_id" = sq1."user_id"
    AND sq2."session_question_id" != sq1."session_question_id"
);--> statement-breakpoint

-- Step 4: Now add the NOT NULL constraints
ALTER TABLE "session_questions" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session_questions" ALTER COLUMN "topic_id" SET NOT NULL;--> statement-breakpoint

-- Continue with the rest of your migration
ALTER TABLE "topic_mastery" ADD COLUMN "session_id" integer;--> statement-breakpoint
ALTER TABLE "topic_mastery" ADD COLUMN "question_id" integer;--> statement-breakpoint

-- Add constraints
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_session_id_practice_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Create indexes
CREATE UNIQUE INDEX "unique_user_topic_idx" ON "session_questions" USING btree ("user_id","topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_session_question_idx" ON "topic_mastery" USING btree ("session_id","question_id");