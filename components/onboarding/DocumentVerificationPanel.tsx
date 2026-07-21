"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
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

  // Polling por documento: el overall puede ser "incomplete" (faltan otros
  // docs) mientras uno individual sigue en verificación, y aun así hay que
  // refrescar hasta que llegue el resultado.
  const shouldPoll = (status?.documents ?? []).some(
    (d) => d.status === "submitted" || d.status === "processing",
  );

  useEffect(() => {
    if (!shouldPoll) return;
    const id = window.setInterval(() => {
      void fetchStatus();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [shouldPoll, fetchStatus]);

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

  const documents = status?.documents ?? [];
  const approvedCount = documents.filter((d) => d.status === "aprobado").length;
  const totalCount = documents.length || 4;
  const anyInFlight = documents.some(
    (d) => d.status === "submitted" || d.status === "processing",
  );
  const anyRejected = documents.some((d) => d.status === "rechazado");
  const anyManual = documents.some((d) => d.status === "revision_manual");
  const allApproved = totalCount > 0 && approvedCount === totalCount;

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

      <ProgressBanner
        approvedCount={approvedCount}
        totalCount={totalCount}
        documents={documents}
        anyInFlight={anyInFlight}
        anyRejected={anyRejected}
        anyManual={anyManual}
        allApproved={allApproved}
      />

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.tipo}
            doc={doc}
            isUploading={uploadingTipo === doc.tipo}
            selectedFile={selectedFiles[doc.tipo] ?? null}
            onSelectFile={(f) =>
              setSelectedFiles((prev) => ({ ...prev, [doc.tipo]: f }))
            }
            onUpload={() => void uploadTipo(doc.tipo)}
          />
        ))}
      </ul>
    </div>
  );
}

function ProgressBanner({
  approvedCount,
  totalCount,
  documents,
  anyInFlight,
  anyRejected,
  anyManual,
  allApproved,
}: {
  approvedCount: number;
  totalCount: number;
  documents: DocumentStatusItem[];
  anyInFlight: boolean;
  anyRejected: boolean;
  anyManual: boolean;
  allApproved: boolean;
}) {
  if (allApproved) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <CheckCircle2 className="size-5 shrink-0" />
        <span>
          <span className="font-semibold">Verificación completada.</span> Ya
          puedes continuar con la app móvil.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-[#e3e5ec] bg-[#f8f9ff] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#000615]">
          {anyInFlight ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-[#00658d]" />
          ) : null}
          <span className="font-semibold">
            {approvedCount} de {totalCount} documentos verificados
          </span>
        </div>
        {anyInFlight ? (
          <span className="text-xs text-[#00658d]">Verificando…</span>
        ) : null}
      </div>

      <div className="flex gap-1.5">
        {documents.map((doc) => (
          <div
            key={doc.tipo}
            title={TIPO_LABELS[doc.tipo] ?? doc.tipo}
            className={`h-1.5 flex-1 overflow-hidden rounded-full ${segmentClass(doc.status)}`}
          >
            {doc.status === "submitted" || doc.status === "processing" ? (
              <div className="h-full w-1/3 animate-svd-indeterminate rounded-full bg-[#00658d]" />
            ) : null}
          </div>
        ))}
      </div>

      {anyInFlight ? (
        <p className="text-xs leading-5 text-[#44474d]">
          Estamos verificando tus documentos. Suele tardar menos de un minuto;
          esta pantalla se actualiza sola.
        </p>
      ) : anyRejected ? (
        <p className="text-xs leading-5 text-red-800">
          Algunos documentos fueron rechazados. Revisa el motivo y vuelve a
          subirlos.
        </p>
      ) : anyManual ? (
        <p className="text-xs leading-5 text-amber-900">
          Uno o más documentos están en revisión manual. Te avisaremos cuando
          estén listos.
        </p>
      ) : (
        <p className="text-xs leading-5 text-[#44474d]">
          Sube los documentos pendientes para completar tu verificación.
        </p>
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  isUploading,
  selectedFile,
  onSelectFile,
  onUpload,
}: {
  doc: DocumentStatusItem;
  isUploading: boolean;
  selectedFile: File | null;
  onSelectFile: (file: File | null) => void;
  onUpload: () => void;
}) {
  const label = TIPO_LABELS[doc.tipo] ?? doc.tipo;
  const inFlight = doc.status === "submitted" || doc.status === "processing";
  const canUpload =
    doc.status === "absent" ||
    doc.status === "pending" ||
    doc.status === "rechazado";
  const showRetry = doc.status === "rechazado";

  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors ${cardClass(doc.status)}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <StatusIcon status={doc.status} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#000615]">{label}</p>
            <p className={`text-xs ${statusTextClass(doc.status)}`}>
              {statusLabel(doc.status)}
              {doc.status === "rechazado" && doc.lastError
                ? ` — ${doc.lastError}`
                : ""}
            </p>
          </div>
        </div>

        {canUpload ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#c4c6ce] bg-white px-2.5 py-1.5 text-xs font-medium text-[#00658d] hover:bg-[#e5efff]">
              <Upload className="size-3.5" />
              {selectedFile?.name
                ? truncate(selectedFile.name, 18)
                : "Elegir archivo"}
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              disabled={isUploading || !selectedFile}
              onClick={onUpload}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#00658d] px-2.5 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : showRetry ? (
                <RefreshCw className="size-3.5" />
              ) : null}
              {isUploading ? "Enviando…" : showRetry ? "Reintentar" : "Enviar"}
            </button>
          </div>
        ) : null}
      </div>

      {inFlight ? (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#d6e4ff]">
          <div className="h-full w-1/3 animate-svd-indeterminate rounded-full bg-[#00658d]" />
        </div>
      ) : null}
    </li>
  );
}

function StatusIcon({ status }: { status: DocumentStatusItem["status"] }) {
  switch (status) {
    case "submitted":
    case "processing":
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e5efff]">
          <Loader2 className="size-4.5 animate-spin text-[#00658d]" />
        </span>
      );
    case "aprobado":
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-4.5 text-emerald-600" />
        </span>
      );
    case "rechazado":
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100">
          <XCircle className="size-4.5 text-red-600" />
        </span>
      );
    case "revision_manual":
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Clock className="size-4.5 text-amber-700" />
        </span>
      );
    default:
      return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eceef4]">
          <FileText className="size-4.5 text-[#44474d]" />
        </span>
      );
  }
}

function segmentClass(status: DocumentStatusItem["status"]): string {
  switch (status) {
    case "aprobado":
      return "bg-emerald-500";
    case "rechazado":
      return "bg-red-400";
    case "revision_manual":
      return "bg-amber-400";
    case "submitted":
    case "processing":
      return "bg-[#d6e4ff]";
    default:
      return "bg-[#e3e5ec]";
  }
}

function cardClass(status: DocumentStatusItem["status"]): string {
  switch (status) {
    case "aprobado":
      return "border-emerald-200 bg-emerald-50/60";
    case "rechazado":
      return "border-red-200 bg-red-50/60";
    case "revision_manual":
      return "border-amber-200 bg-amber-50/60";
    case "submitted":
    case "processing":
      return "border-[#b9d3ff] bg-[#f2f7ff]";
    default:
      return "border-[#e3e5ec] bg-[#f8f9ff]";
  }
}

function statusTextClass(status: DocumentStatusItem["status"]): string {
  switch (status) {
    case "aprobado":
      return "text-emerald-700";
    case "rechazado":
      return "text-red-700";
    case "revision_manual":
      return "text-amber-800";
    case "submitted":
    case "processing":
      return "text-[#00658d]";
    default:
      return "text-[#44474d]";
  }
}

function statusLabel(status: DocumentStatusItem["status"]): string {
  switch (status) {
    case "absent":
    case "pending":
      return "Pendiente de subir";
    case "submitted":
      return "Enviado — en cola de verificación";
    case "processing":
      return "Verificando documento…";
    case "aprobado":
      return "Aprobado";
    case "rechazado":
      return "Rechazado";
    case "revision_manual":
      return "En revisión manual";
    default:
      return status;
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
