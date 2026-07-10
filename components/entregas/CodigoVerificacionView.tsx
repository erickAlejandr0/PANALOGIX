"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Ably from "ably";
import { Check, Clock, Copy, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { regenerarCodigoAction } from "@/actions/negociacionActions";
import { CODIGO_VERIFICACION } from "@/lib/fletes/constants";
import { viajeChannel } from "@/lib/events/channels";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/types";
import { getEmpresaRealtimeClient } from "@/lib/realtime/ably-client";
import { formatMmSs } from "@/lib/entregas/otp";
import { formatPesoLabel } from "@/lib/publicaciones/format";

type CodigoVerificacionViewProps = {
  viajeId: number;
  fleteCodigo: string;
  pesoKg: number;
  codigo: string;
  expiraEn: string;
};

const TTL_SECONDS = Math.round(CODIGO_VERIFICACION.TTL_MS / 1000);

function secondsUntil(expira: string): number {
  const diff = new Date(expira).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

export function CodigoVerificacionView({
  viajeId,
  fleteCodigo,
  pesoKg,
  codigo,
  expiraEn,
}: CodigoVerificacionViewProps) {
  const router = useRouter();
  const [code, setCode] = useState(codigo);
  const [expira, setExpira] = useState(expiraEn);
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(expiraEn));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Countdown derivado siempre de la expiracion real (resistente a drift).
  useEffect(() => {
    setSecondsLeft(secondsUntil(expira));
    const interval = setInterval(() => {
      setSecondsLeft(secondsUntil(expira));
    }, 1000);
    return () => clearInterval(interval);
  }, [expira]);

  // Auto-avance de la empresa: cuando el transportista verifica el codigo, el
  // backend emite el resumen y ambos roles pasan a la pantalla final.
  useEffect(() => {
    const client = getEmpresaRealtimeClient();
    const channel = client.channels.get(viajeChannel(viajeId));

    const onResumen = (_message: Ably.Message) => {
      router.replace(`/entrega-completada/${viajeId}`);
    };

    channel.subscribe(DOMAIN_EVENT_NAMES.VIAJE_NEGOCIACION_RESUMEN, onResumen);

    return () => {
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.VIAJE_NEGOCIACION_RESUMEN,
        onResumen,
      );
    };
  }, [router, viajeId]);

  const regenerate = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await regenerarCodigoAction(viajeId);
      if (result && "success" in result && result.success) {
        setCode(result.data.codigo);
        setExpira(result.data.expiraEn);
        setCopied(false);
        return;
      }
      const message =
        result && "error" in result ? result.error : "No se pudo regenerar";
      setError(message ?? "No se pudo regenerar");
    });
  }, [viajeId]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [code]);

  const expired = secondsLeft <= 0;
  const percentLeft = Math.max(
    0,
    Math.min(100, Math.round((secondsLeft / TTL_SECONDS) * 100)),
  );
  const digits = code.split("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9ff] px-4 py-10">
      <p className="mb-4 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.6px]">
        <span className="text-[#75777e]">Paso 2 de 3</span>
        <span className="text-[#75777e]">·</span>
        <span className="text-[#00658d]">Confirmación</span>
      </p>

      <section className="relative w-full max-w-[672px] overflow-hidden rounded-[24px] border border-[#e1e2e8] bg-white px-8 pb-6 pt-8 shadow-[0px_2px_16px_0px_rgba(11,31,58,0.04)] sm:px-16">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#e1e2e8] to-transparent opacity-50"
        />

        <div className="flex flex-col items-center">
          <h1 className="text-center font-mono text-2xl font-semibold text-[#191c20]">
            Código de confirmación
          </h1>
          <p className="mt-2 max-w-[512px] text-center text-base text-[#44474d]">
            Comparta este código con el transportista para autorizar la entrega
            del flete
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-2 sm:gap-4">
          {digits.map((digit, index) => (
            <div
              key={`${index}-${digit}`}
              className={`flex h-20 w-12 items-center justify-center rounded-[12px] border bg-[#f2f3f9] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] sm:w-16 ${
                expired ? "border-[#fecaca] opacity-50" : "border-[#c4c6ce]"
              }`}
            >
              <span className="font-mono text-4xl font-bold tracking-[-0.96px] text-[#000615] sm:text-5xl">
                {digit}
              </span>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 w-full max-w-[448px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#75777e]">
              <Clock className="size-3" />
              {expired ? "Código expirado" : `Expira en ${formatMmSs(secondsLeft)}`}
            </span>
            <span className="text-[10px] font-bold text-[#75777e]">
              {percentLeft}% restante
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e7e8ee]">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                expired ? "bg-[#ef4444]" : "bg-[#2dbcfe]"
              }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>
        </div>

        {error ? (
          <p className="mx-auto mt-4 max-w-[448px] text-center text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : null}

        <div className="mx-auto mt-8 flex w-full max-w-[448px] flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={copy}
            disabled={expired}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#000615] text-sm font-semibold text-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition hover:bg-[#0b1f3a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copiar código
              </>
            )}
          </button>
          <button
            type="button"
            onClick={regenerate}
            disabled={isPending}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#c4c6ce] bg-white text-sm font-semibold text-[#191c20] transition hover:bg-[#f2f3f9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Regenerar
          </button>
        </div>

        <div className="mt-6 flex items-start gap-4 border-t border-[#e1e2e8] pt-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#c4c6ce] bg-[#f2f3f9]">
            <ShieldCheck className="size-4 text-[#16a34a]" />
          </span>
          <p className="text-sm text-[#44474d]">
            Código de un solo uso, cifrado y auditado.{" "}
            <span className="font-semibold text-[#191c20]">
              Nunca lo comparta por canales no autorizados.
            </span>
          </p>
        </div>
      </section>

      <p className="mt-6 text-[10px] font-bold tracking-[0.25px] text-[#75777e]">
        Flete #{fleteCodigo} · {formatPesoLabel(pesoKg)}
      </p>
    </main>
  );
}
