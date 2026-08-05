ALTER TABLE "profiles" ADD COLUMN "photo_path" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_minor" boolean DEFAULT false NOT NULL;