ALTER TABLE "viajes" ADD COLUMN IF NOT EXISTS "fase" varchar(32) DEFAULT 'asignado' NOT NULL;

UPDATE "viajes" SET "fase" = 'hacia_origen' WHERE "fase" = 'asignado' AND "id_estado" = 1;
