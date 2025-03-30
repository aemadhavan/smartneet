CREATE TABLE "subjects" (
	"subject_id" serial PRIMARY KEY NOT NULL,
	"subject_name" varchar(50) NOT NULL,
	"subject_code" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true
);
