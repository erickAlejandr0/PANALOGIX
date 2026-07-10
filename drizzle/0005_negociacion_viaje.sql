ALTER TABLE "viajes" ADD COLUMN IF NOT EXISTS "codigo_verificacion_hash" varchar(128);

ALTER TABLE "viajes" ADD COLUMN IF NOT EXISTS "codigo_verificacion_expira" timestamp;

ALTER TABLE "viajes" ADD COLUMN IF NOT EXISTS "codigo_verificacion_intentos" smallint NOT NULL DEFAULT 0;

UPDATE "viajes" SET "fase" = 'resumen' WHERE "fase" = 'pendiente_pago';
