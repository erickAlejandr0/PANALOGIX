DO $$ BEGIN
  CREATE TYPE "public"."billing_setup_status" AS ENUM('pending', 'incomplete', 'ready', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."payment_escrow_status" AS ENUM('pending', 'held', 'released', 'refunded', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "stripe_default_payment_method_id" varchar(255);
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "billing_setup_status" "billing_setup_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "billing_payment_method_last4" varchar(4);
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "billing_payment_method_brand" varchar(32);
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "billing_payment_method_exp_month" smallint;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "billing_payment_method_exp_year" smallint;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "billing_setup_completed_at" timestamp;

ALTER TABLE "transportistas" ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" varchar(255);
ALTER TABLE "transportistas" ADD COLUMN IF NOT EXISTS "billing_setup_status" "billing_setup_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "transportistas" ADD COLUMN IF NOT EXISTS "payouts_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "transportistas" ADD COLUMN IF NOT EXISTS "charges_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "transportistas" ADD COLUMN IF NOT EXISTS "connect_payout_last4" varchar(4);
ALTER TABLE "transportistas" ADD COLUMN IF NOT EXISTS "billing_setup_completed_at" timestamp;

CREATE TABLE IF NOT EXISTS "payment_escrows" (
  "id" serial PRIMARY KEY NOT NULL,
  "id_publicacion" integer NOT NULL UNIQUE,
  "id_flete" integer NOT NULL,
  "id_empresa" integer NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" varchar(3) DEFAULT 'usd' NOT NULL,
  "stripe_payment_intent_id" varchar(255) NOT NULL UNIQUE,
  "stripe_charge_id" varchar(255),
  "stripe_transfer_id" varchar(255),
  "stripe_refund_id" varchar(255),
  "status" "payment_escrow_status" DEFAULT 'pending' NOT NULL,
  "held_at" timestamp,
  "released_at" timestamp,
  "refunded_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "payment_escrows" ADD CONSTRAINT "payment_escrows_id_publicacion_publicaciones_id_fk" FOREIGN KEY ("id_publicacion") REFERENCES "public"."publicaciones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment_escrows" ADD CONSTRAINT "payment_escrows_id_flete_fletes_id_fk" FOREIGN KEY ("id_flete") REFERENCES "public"."fletes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment_escrows" ADD CONSTRAINT "payment_escrows_id_empresa_empresas_id_fk" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
