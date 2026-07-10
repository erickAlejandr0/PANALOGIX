"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  CircleCheck,
  ClipboardCheck,
  Copy,
  FileText,
  KeyRound,
  Lock,
  MapPin,
  MoreVertical,
  User,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrencyUsd } from "@/lib/publicaciones/format";

type EntregaCompletadaViewProps = {
  fleteCodigo: string;
  pago: number;
  receptor: string;
  destino: string;
  completadaEn: string;
  stripePaymentIntentId?: string | null;
  stripeTransferId?: string | null;
  paymentStatus?: string | null;
  platformFee?: string | null;
  stripeFee?: string | null;
  transportistaPayout?: string | null;
  platformFeePercent?: number | null;
};

const CHECKLIST: { label: string; badge: string; icon: LucideIcon }[] = [
  { label: "Inspección de carga", badge: "Completado", icon: ClipboardCheck },
  { label: "Verificación por Código", badge: "Verificado", icon: KeyRound },
  { label: "Pago procesado", badge: "Procesado", icon: Wallet },
];

export function EntregaCompletadaView({
  fleteCodigo,
  pago,
  receptor,
  destino,
  completadaEn,
  stripePaymentIntentId,
  stripeTransferId,
  paymentStatus,
  platformFee,
  stripeFee,
  transportistaPayout,
  platformFeePercent,
}: EntregaCompletadaViewProps) {
  const [copied, setCopied] = useState(false);

  const copyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fleteCodigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [fleteCodigo]);

  const summary: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Receptor", value: receptor, icon: User },
    { label: "Destino", value: destino, icon: MapPin },
    { label: "Flete", value: fleteCodigo, icon: FileText },
    { label: "Fecha", value: completadaEn, icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff]">
      <header className="flex h-16 items-center justify-between bg-[#f8f9ff] px-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
        <Link
          href="/entregas"
          className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm text-[#191c20] transition hover:bg-[rgba(11,31,58,0.06)]"
        >
          <ArrowLeft className="size-4" />
          SALIR
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm uppercase tracking-[0.7px] text-[#44474d] opacity-60">
            Paso 3 de 3
          </span>
          <span className="h-1 w-24 overflow-hidden rounded-full bg-[#e1e2e8]">
            <span className="block h-full w-full bg-[#009b50]" />
          </span>
          <button
            type="button"
            disabled
            aria-label="Más opciones"
            className="rounded-full p-1.5 text-[#44474d] opacity-60"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[896px] flex-col items-center px-4 py-12">
        <section className="flex w-full flex-col gap-10 rounded-[12px] border border-[#c4c6ce] bg-white p-8 shadow-[0px_4px_12px_rgba(11,31,58,0.08)] sm:p-12">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-[rgba(74,225,131,0.2)]">
              <CircleCheck className="size-10 text-[#009b50]" />
            </span>
            <h1 className="mt-6 font-mono text-3xl font-bold text-[#191c20]">
              Entrega Completada
            </h1>
            <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-[rgba(196,198,206,0.3)] bg-[#eceef3] px-3 py-1 font-mono text-sm font-bold text-[#44474d]">
              <Check className="size-3 text-[#009b50]" />#{fleteCodigo}
            </span>
            <p className="mt-4 max-w-[512px] text-base text-[#44474d]">
              Todos los pasos del flete fueron completados correctamente y el
              pago fue liquidado al transportista vía Stripe.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {CHECKLIST.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[12px] border border-[#c4c6ce] bg-[rgba(242,243,249,0.5)] p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(0,155,80,0.1)]">
                      <Icon className="size-5 text-[#009b50]" />
                    </span>
                    <span className="text-base text-[#191c20]">
                      {item.label}
                    </span>
                  </div>
                  <span className="rounded-full border border-[rgba(74,225,131,0.3)] bg-[rgba(74,225,131,0.2)] px-3 py-1 font-mono text-xs font-bold uppercase tracking-[1.2px] text-[#009b50]">
                    {item.badge}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-[12px] bg-[#0b1f3a] p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[2.4px] text-[rgba(117,135,167,0.8)]">
                  Resumen de transacción
                </p>
                <p className="mt-1 flex items-end gap-2 font-mono">
                  <span className="text-4xl font-bold tracking-[-0.9px] text-white">
                    {formatCurrencyUsd(pago)}
                  </span>
                  <span className="text-xl text-[#7587a7]">USD</span>
                </p>
              </div>
              <span className="rounded-full border border-[rgba(0,155,80,0.3)] bg-[rgba(0,155,80,0.2)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[1px] text-[#009b50]">
                {paymentStatus === "released" ? "Stripe" : "Reservado"}
              </span>
            </div>

            {(stripeTransferId || stripePaymentIntentId) && (
              <div className="mb-4 rounded-lg bg-[rgba(117,135,167,0.12)] px-4 py-3 font-mono text-xs text-[#d1d5db]">
                {stripeTransferId ? (
                  <p>Transfer: {stripeTransferId}</p>
                ) : null}
                {stripePaymentIntentId ? (
                  <p className="mt-1">Payment: {stripePaymentIntentId}</p>
                ) : null}
              </div>
            )}

            <div className="my-8 h-px w-full bg-[rgba(117,135,167,0.2)]" />

            {transportistaPayout ? (
              <div className="mb-6 space-y-2 rounded-lg bg-[rgba(117,135,167,0.08)] px-4 py-3 text-sm">
                <div className="flex justify-between text-[#d1d5db]">
                  <span>Total del flete</span>
                  <span className="font-mono">{formatCurrencyUsd(pago)}</span>
                </div>
                {platformFee ? (
                  <div className="flex justify-between text-[#d1d5db]">
                    <span>
                      Comisión Panalogix
                      {platformFeePercent != null
                        ? ` (${platformFeePercent}%)`
                        : ""}
                    </span>
                    <span className="font-mono">
                      − {formatCurrencyUsd(platformFee)}
                    </span>
                  </div>
                ) : null}
                {stripeFee ? (
                  <div className="flex justify-between text-[#d1d5db]">
                    <span>Procesamiento Stripe</span>
                    <span className="font-mono">
                      − {formatCurrencyUsd(stripeFee)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between font-semibold text-white">
                  <span>Pago al transportista</span>
                  <span className="font-mono">
                    {formatCurrencyUsd(transportistaPayout)}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {summary.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(117,135,167,0.2)]">
                      <Icon className="size-4 text-white" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[1px] text-[rgba(117,135,167,0.6)]">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-base font-semibold text-white">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={copyId}
              className="flex flex-1 items-center justify-center gap-3 rounded-[12px] border-2 border-[#0b1f3a] px-6 py-4 text-sm font-bold text-[#0b1f3a] transition hover:bg-[rgba(11,31,58,0.05)]"
            >
              {copied ? (
                <>
                  <Check className="size-5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="size-5" />
                  Copiar ID
                </>
              )}
            </button>
            <button
              type="button"
              disabled
              className="flex flex-1 items-center justify-center gap-3 rounded-[12px] bg-[#0b1f3a] px-6 py-4 text-sm font-bold text-white opacity-70 disabled:cursor-not-allowed"
            >
              <FileText className="size-5" />
              Comprobante PDF
            </button>
          </div>
        </section>

        <div className="flex items-center gap-2 pt-8 opacity-50">
          <Lock className="size-3 text-[#44474d]" />
          <p className="text-xs text-[#44474d]">
            Transacción encriptada y verificada por Panalogix Operational Trust
            Center
          </p>
        </div>
      </main>
    </div>
  );
}
