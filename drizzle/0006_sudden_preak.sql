CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'premium', 'institutional');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired');--> statement-breakpoint
CREATE TABLE "payment_history" (
	"payment_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"subscription_id" integer,
	"amount_inr" integer NOT NULL,
	"stripe_payment_id" varchar(100),
	"stripe_invoice_id" varchar(100),
	"payment_method" varchar(50),
	"payment_status" varchar(50) NOT NULL,
	"payment_date" timestamp NOT NULL,
	"next_billing_date" timestamp,
	"receipt_url" varchar(255),
	"gst_details" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"plan_id" serial PRIMARY KEY NOT NULL,
	"plan_name" varchar(50) NOT NULL,
	"plan_code" "subscription_plan" NOT NULL,
	"description" varchar(255),
	"price_inr" integer NOT NULL,
	"price_id_stripe" varchar(100) NOT NULL,
	"product_id_stripe" varchar(100) NOT NULL,
	"features" json,
	"test_limit_daily" integer,
	"duration_days" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"subscription_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"plan_id" integer NOT NULL,
	"stripe_subscription_id" varchar(100),
	"stripe_customer_id" varchar(100),
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp,
	"trial_end" timestamp,
	"tests_used_today" integer DEFAULT 0,
	"tests_used_total" integer DEFAULT 0,
	"last_test_date" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_subscription_id_user_subscriptions_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("subscription_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("plan_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions" USING btree ("user_id");