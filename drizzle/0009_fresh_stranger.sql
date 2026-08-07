CREATE TABLE "emergency_shelter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"occupancy" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "emergency_shelter" ADD CONSTRAINT "emergency_shelter_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;