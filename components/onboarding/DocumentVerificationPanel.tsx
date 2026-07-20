"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";

import type {
  DocumentStatusItem,
  DocumentStatusResponse,
} from "@/service/documentVerificationService";

const TIPO_LABELS: Record<string, string> = {
  cedula: "Cédula de identidad",
  licencia: "Licencia de conducir",
  soat: "SOAT",
  revisado: "Revisado técnico",
};

const POLL_MS = 2500;

type Props = {
  initialStatus?: DocumentStatusResponse | null;
};

export function DocumentVerificationPanel({ initialStatus = null }: Props) {
  const [status, setStatus] = useState<DocumentStatusResponse | null>(
    initialStatus,
  );
  const [loading, setLoading] = useState(!initialStatus);
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<
    Record<string, File | null>
  >({});

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/transportista/documentos/estado", {
        credentials: "include",
      });
      const body = (await res.json()) as {
        data?: DocumentStatusResponse;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "No se pudo cargar el estado");
      }
      if (body.data) {
        setStatus(body.data);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const shouldPoll =
    status?.overall === "processing" || status?.overall === "manual_review";

  useEffect(() => {
    if (!shouldPoll) return;
    const id = window.setInterval(() => {
      void fetchStatus();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [shouldPoll, fetchStatus]);

  const byTipo = useMemo(() => {
    const map = new Map<string, DocumentStatusItem>();
    for (const doc of status?.documents ?? []) {
      map.set(doc.tipo, doc);
    }
    return map;
  }, [status]);

  async function uploadTipo(tipo: string) {
    const file = selectedFiles[tipo];
    if (!file) {
      setError("Selecciona un archivo primero");
      return;
    }
    setUploadingTipo(tipo);
    setError(null);
    try {
      const form = new FormData();
      form.append("tipo_documento", tipo);
      form.append("file", file);
      const res = await fetch("/api/transportista/documentos/enviar", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "No se pudo enviar el documento");
      }
      setSelectedFiles((prev) => ({ ...prev, [tipo]: null }));
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setUploadingTipo(null);
    }
  }

  if (loading && !status) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#c4c6ce]/50 bg-white/80 p-6 text-[#44474d]">
        <Loader2 className="size-5 animate-spin text-[#00658d]" />
        Cargando estado de verificación…
      </div>
    );
  }

  if (status && !status.svdConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        La verificación documental aún no está configurada en este entorno.
        Puedes continuar con la app; contacta a soporte si necesitas activarla.
      </div>
    );
  }

  const overall = status?.overall ?? "incomplete";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[rgba(196,198,206,0.5)] bg-white/80 p-5 shadow-[0px_4px_16px_0px_rgba(11,31,58,0.04)]">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-lg font-bold tracking-[-0.3px] text-[#000615]">
          Verifica tus documentos
        </h2>
        <p className="text-sm leading-6 text-[#44474d]">
          Sube cédula, licencia, SOAT y revisado técnico. Validamos contra los
          datos de tu registro (identidad o placa según el documento).
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {overall === "processing" ? (
        <div className="flex items-center gap-3 rounded-lg border border-[#c4c6ce] bg-[#e5efff] px-4 py-3 text-sm text-[#00658d]">
          <Loader2 className="size-5 shrink-0 animate-spin" />
          <span>
            Verificando documentos… Esto suele tardar unos segundos. No cierres
            esta ventana.
          </span>
        </div>
      ) : null}

      {overall === "completed" ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="font-semibold">Verificación completada.</span>
          <span>Ya puedes continuar con la app móvil.</span>
        </div>
      ) : null}

      {overall === "manual_review" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Uno o más documentos están en revisión manual. Te avisaremos cuando
          estén listos; puedes dejar esta página abierta.
        </div>
      ) : null}

      {overall === "needs_retry" ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Algunos documentos fueron rechazados. Corrígelos y vuelve a
          intentarlo.
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {(status?.documents ?? []).map((doc) => {
          const label = TIPO_LABELS[doc.tipo] ?? doc.tipo;
          const isBusy = uploadingTipo === doc.tipo;
          const canUpload =
            doc.status === "absent" ||
            doc.status === "pending" ||
            doc.status === "rechazado";
          const showRetry = doc.status === "rechazado";

          return (
            <li
              key={doc.tipo}
              className="flex flex-col gap-2 rounded-lg border border-[#e3e5ec] bg-[#f8f9ff] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#000615]">{label}</p>
                <p className="text-xs text-[#44474d]">
                  {statusLabel(doc.status)}
                  {doc.lastError ? ` — ${doc.lastError}` : ""}
                </p>
              </div>

              {canUpload ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#c4c6ce] bg-white px-2.5 py-1.5 text-xs font-medium text-[#00658d] hover:bg-[#e5efff]">
                    <Upload className="size-3.5" />
                    {selectedFiles[doc.tipo]?.name
                      ? truncate(selectedFiles[doc.tipo]!.name, 18)
                      : "Elegir archivo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setSelectedFiles((prev) => ({ ...prev, [doc.tipo]: f }));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={isBusy || !selectedFiles[doc.tipo]}
                    onClick={() => void uploadTipo(doc.tipo)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#00658d] px-2.5 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBusy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : showRetry ? (
                      <RefreshCw className="size-3.5" />
                    ) : null}
                    {showRetry ? "Reintentar" : "Enviar"}
                  </button>
                </div>
              ) : doc.status === "processing" || doc.status === "submitted" ? (
                <Loader2 className="size-4 animate-spin text-[#00658d]" />
              ) : doc.status === "aprobado" ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function statusLabel(status: DocumentStatusItem["status"]): string {
  switch (status) {
    case "absent":
    case "pending":
      return "Pendiente de subir";
    case "submitted":
    case "processing":
      return "En verificación";
    case "aprobado":
      return "Aprobado";
    case "rechazado":
      return "Rechazado";
    case "revision_manual":
      return "Revisión manual";
    default:
      return status;
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
