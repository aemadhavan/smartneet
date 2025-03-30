CREATE TABLE "topics" (
	"topic_id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer,
	"topic_name" varchar(100) NOT NULL,
	"parent_topic_id" integer,
	"topic_description" text,
	"topic_order" integer,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_topic_id_topics_topic_id_fk" FOREIGN KEY ("parent_topic_id") REFERENCES "public"."topics"("topic_id") ON DELETE no action ON UPDATE no action;