export const BILLING_ERROR_CODE = {
  BILLING_REQUIRED: "BILLING_REQUIRED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  STRIPE_NOT_CONFIGURED: "STRIPE_NOT_CONFIGURED",
} as const;

export const BILLING_SETUP_STATUS = {
  PENDING: "pending",
  INCOMPLETE: "incomplete",
  READY: "ready",
  FAILED: "failed",
} as const;

export const PAYMENT_ESCROW_STATUS = {
  PENDING: "pending",
  HELD: "held",
  RELEASED: "released",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;

export const ESCROW_HOLD_DAYS = 7;

export function getStripeSecretKey(): string | null {
  return (
    process.env.STRIPE_TEST_SECRET_KEY ??
    process.env.STRIPE_SECRET_KEY ??
    null
  );
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

export function getStripeCurrency(): string {
  return (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase();
}

export function getConnectDefaultCountry(): string {
  return (process.env.STRIPE_CONNECT_DEFAULT_COUNTRY ?? "US").toUpperCase();
}

export function getConnectReturnUrl(): string {
  return (
    process.env.STRIPE_CONNECT_RETURN_URL ??
    "http://localhost:3000/billing/connect-return?stripe=return"
  );
}

export function getConnectRefreshUrl(): string {
  return (
    process.env.STRIPE_CONNECT_REFRESH_URL ??
    "http://localhost:3000/billing/connect-return?stripe=refresh"
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey());
}

/** Comisión de plataforma (austera por defecto: 5%). */
export function getPlatformFeePercent(): number {
  const raw = process.env.PLATFORM_FEE_PERCENT ?? "5";
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < 0 || value > 30) {
    return 5;
  }
  return value;
}

export function dollarsToCents(amount: number | string): number {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Monto inválido para Stripe");
  }
  return Math.round(value * 100);
}

export function centsToDollars(amountCents: number): number {
  return amountCents / 100;
}
