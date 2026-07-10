ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "photo_url" varchar(512);--> statement-breakpoint
ALTER TABLE "transportistas" ADD COLUMN IF NOT EXISTS "disponible" boolean DEFAULT true NOT NULL;
