CREATE TYPE "public"."profile_status_enum" AS ENUM('active', 'found', 'deceased');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('viewer', 'rescuer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."update_request_status_enum" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "profile_update_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "update_request_status_enum" DEFAULT 'pending' NOT NULL,
	"reviewer_id" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	"last_known_location" text NOT NULL,
	"status" "profile_status_enum" DEFAULT 'active' NOT NULL,
	"contact_phone" text,
	"notes" text,
	"verified" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "role_enum" DEFAULT 'viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_update_requests" ADD CONSTRAINT "profile_update_requests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_update_requests" ADD CONSTRAINT "profile_update_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_update_requests" ADD CONSTRAINT "profile_update_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;