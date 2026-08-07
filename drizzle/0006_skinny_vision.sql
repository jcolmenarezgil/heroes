CREATE TYPE "public"."suggestion_status_enum" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "profile_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"user_id" uuid,
	"submitter_name" text,
	"submitter_contact" text,
	"note" text NOT NULL,
	"status" "suggestion_status_enum" DEFAULT 'pending' NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_suggestions" ADD CONSTRAINT "profile_suggestions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_suggestions" ADD CONSTRAINT "profile_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_suggestions" ADD CONSTRAINT "profile_suggestions_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;