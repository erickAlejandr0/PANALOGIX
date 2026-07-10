import { formatCurrencyUsd } from "@/lib/publicaciones/format";
import type { PaymentBreakdownDto } from "@/lib/stripe/fees";

type PaymentBreakdownPanelProps = {
  breakdown: PaymentBreakdownDto;
  /** empresa: enfatiza el total pagado; transportista: enfatiza el neto */
  variant?: "empresa" | "transportista";
  className?: string;
};

function Row({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={muted ? "text-[#434750]" : "text-[#191c20]"}>{label}</span>
      <span
        className={
          emphasis
            ? "font-mono font-bold text-[#001b44]"
            : muted
              ? "font-mono text-[#434750]"
              : "font-mono text-[#191c20]"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function PaymentBreakdownPanel({
  breakdown,
  variant = "empresa",
  className = "",
}: PaymentBreakdownPanelProps) {
  const total = formatCurrencyUsd(breakdown.totalPago);
  const platformFee = formatCurrencyUsd(breakdown.platformFee);
  const stripeFee = formatCurrencyUsd(breakdown.stripeFeeEstimate);
  const payout = formatCurrencyUsd(breakdown.transportistaPayoutEstimate);

  return (
    <div
      className={`rounded-xl border border-[rgba(0,47,108,0.12)] bg-[#f0f4fa] px-4 py-4 ${className}`}
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.6px] text-[#434750]">
        {variant === "empresa"
          ? "Desglose del pago del flete"
          : "Tu ganancia estimada"}
      </p>

      <div className="flex flex-col gap-2">
        <Row
          label={
            variant === "empresa" ? "Total del flete" : "Oferta de la empresa"
          }
          value={total}
          emphasis={variant === "empresa"}
        />
        <Row
          label={`Comisión Panalogix (${breakdown.platformFeePercent}%)`}
          value={`− ${platformFee}`}
          muted
        />
        <Row
          label="Procesamiento Stripe (est.)"
          value={`− ${stripeFee}`}
          muted
        />
        <div className="my-1 h-px bg-[rgba(0,47,108,0.1)]" />
        <Row
          label={
            variant === "empresa"
              ? "Pago estimado al transportista"
              : "Tu pago estimado"
          }
          value={payout}
          emphasis
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#434750]">
        {variant === "empresa"
          ? "El transportista recibe el neto después de comisiones de plataforma y procesamiento de pago."
          : "Monto aproximado. El valor final se confirma al completar la entrega."}
      </p>
    </div>
  );
}
