-- SVD document verification: UUID bridge + local status table

ALTER TABLE "transportistas"
  ADD COLUMN IF NOT EXISTS "svd_external_id" uuid;

UPDATE "transportistas"
SET "svd_external_id" = gen_random_uuid()
WHERE "svd_external_id" IS NULL;

ALTER TABLE "transportistas"
  ALTER COLUMN "svd_external_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "transportistas"
  ALTER COLUMN "svd_external_id" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "transportistas"
    ADD CONSTRAINT "transportistas_svd_external_id_unique" UNIQUE ("svd_external_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."document_verification_status" AS ENUM(
    'pending',
    'submitted',
    'processing',
    'aprobado',
    'rechazado',
    'revision_manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "document_verifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "transportista_id" integer NOT NULL,
  "tipo_documento" varchar(40) NOT NULL,
  "svd_documento_id" uuid,
  "s3_key_raw" text,
  "status" "document_verification_status" DEFAULT 'pending' NOT NULL,
  "resultado_svd" varchar(40),
  "score_lectura" varchar(16),
  "score_autenticidad" varchar(16),
  "fecha_vencimiento" date,
  "last_error" text,
  "submitted_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "document_verifications"
    ADD CONSTRAINT "document_verifications_transportista_id_transportistas_id_fk"
    FOREIGN KEY ("transportista_id") REFERENCES "public"."transportistas"("id")
    ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "document_verifications"
    ADD CONSTRAINT "document_verifications_transportista_tipo_unique"
    UNIQUE ("transportista_id", "tipo_documento");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "document_verifications_transportista_status_idx"
  ON "document_verifications" ("transportista_id", "status");
