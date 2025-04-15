ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "is_image_based" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "image_url" varchar(255);