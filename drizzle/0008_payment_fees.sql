ALTER TABLE "payment_escrows" ADD COLUMN IF NOT EXISTS "platform_fee_cents" integer;
ALTER TABLE "payment_escrows" ADD COLUMN IF NOT EXISTS "stripe_fee_cents" integer;
ALTER TABLE "payment_escrows" ADD COLUMN IF NOT EXISTS "transportista_payout_cents" integer;
