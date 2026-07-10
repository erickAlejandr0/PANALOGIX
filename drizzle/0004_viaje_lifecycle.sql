ALTER TYPE "public"."estado_publicacion" ADD VALUE IF NOT EXISTS 'archivado';

ALTER TABLE "fletes" ADD COLUMN IF NOT EXISTS "estado" varchar(32) NOT NULL DEFAULT 'activo';

ALTER TABLE "viajes" ADD COLUMN IF NOT EXISTS "alerta_destino_enviada" boolean NOT NULL DEFAULT false;

ALTER TABLE "viajes" ADD COLUMN IF NOT EXISTS "alerta_llegada_enviada" boolean NOT NULL DEFAULT false;

UPDATE "fletes" SET "estado" = 'activo' WHERE "estado" IS NULL;
