CREATE TABLE "sequence_items" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"sequence_id" integer,
	"item_number" integer NOT NULL,
	"item_label" varchar(10),
	"item_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequence_ordering_questions" (
	"sequence_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"intro_text" text,
	"correct_sequence" text NOT NULL,
	CONSTRAINT "sequence_ordering_questions_question_id_unique" UNIQUE("question_id")
);
--> statement-breakpoint
ALTER TABLE "sequence_items" ADD CONSTRAINT "sequence_items_sequence_id_sequence_ordering_questions_sequence_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequence_ordering_questions"("sequence_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_ordering_questions" ADD CONSTRAINT "sequence_ordering_questions_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;