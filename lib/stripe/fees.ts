import {
  centsToDollars,
  dollarsToCents,
  getPlatformFeePercent,
  getStripeCurrency,
} from "@/lib/stripe/config";

/** Stripe US: 2.9% + $0.30 (estimado para UI; el real se lee del balance_transaction). */
const STRIPE_PERCENT_BPS = 290;
const STRIPE_FIXED_CENTS = 30;

export type PaymentBreakdown = {
  totalPagoCents: number;
  platformFeeCents: number;
  platformFeePercent: number;
  stripeFeeEstimateCents: number;
  transportistaPayoutEstimateCents: number;
  currency: string;
};

export type PaymentBreakdownDto = {
  totalPago: string;
  platformFee: string;
  platformFeePercent: number;
  stripeFeeEstimate: string;
  transportistaPayoutEstimate: string;
  currency: string;
};

export function estimateStripeFeeCents(amountCents: number): number {
  return (
    Math.round((amountCents * STRIPE_PERCENT_BPS) / 10_000) + STRIPE_FIXED_CENTS
  );
}

export function calculatePlatformFeeCents(
  amountCents: number,
  percent?: number,
): number {
  const rate = percent ?? getPlatformFeePercent();
  return Math.round((amountCents * rate) / 100);
}

export function buildPaymentBreakdown(
  totalPago: number | string,
): PaymentBreakdown | null {
  try {
    const totalPagoCents = dollarsToCents(totalPago);
    const platformFeePercent = getPlatformFeePercent();
    const platformFeeCents = calculatePlatformFeeCents(
      totalPagoCents,
      platformFeePercent,
    );
    const stripeFeeEstimateCents = estimateStripeFeeCents(totalPagoCents);
    const transportistaPayoutEstimateCents = Math.max(
      0,
      totalPagoCents - platformFeeCents - stripeFeeEstimateCents,
    );

    return {
      totalPagoCents,
      platformFeeCents,
      platformFeePercent,
      stripeFeeEstimateCents,
      transportistaPayoutEstimateCents,
      currency: getStripeCurrency(),
    };
  } catch {
    return null;
  }
}

export function breakdownToDto(breakdown: PaymentBreakdown): PaymentBreakdownDto {
  return {
    totalPago: centsToDollars(breakdown.totalPagoCents).toFixed(2),
    platformFee: centsToDollars(breakdown.platformFeeCents).toFixed(2),
    platformFeePercent: breakdown.platformFeePercent,
    stripeFeeEstimate: centsToDollars(breakdown.stripeFeeEstimateCents).toFixed(
      2,
    ),
    transportistaPayoutEstimate: centsToDollars(
      breakdown.transportistaPayoutEstimateCents,
    ).toFixed(2),
    currency: breakdown.currency,
  };
}

export function resolveTransferAmountCents(
  netCents: number,
  platformFeeCents: number,
): { transferCents: number; error?: string } {
  const transferCents = netCents - platformFeeCents;
  if (transferCents < 1) {
    return {
      transferCents: 0,
      error:
        "El monto neto no alcanza para cubrir comisiones. Aumenta el total del flete.",
    };
  }
  return { transferCents };
}
