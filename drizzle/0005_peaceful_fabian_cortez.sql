--DROP INDEX "unique_user_topic_idx";--> statement-breakpoint
DROP INDEX "unique_session_question_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "unique_session_question_idx_sq" ON "session_questions" USING btree ("session_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_topic_mastery_idx" ON "topic_mastery" USING btree ("user_id","topic_id");