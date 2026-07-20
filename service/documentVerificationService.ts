import { flotaRepository } from "@/repositories/flotaRepository";
import { transportistaRepository } from "@/repositories/transportistaRepository";
import { documentVerificationRepository } from "@/repositories/documentVerificationRepository";
import {
  crearVerificacion,
  generarUrl,
  listarVerificaciones,
  SvdClientError,
  uploadToPresignedPost,
} from "@/lib/svd/client";
import {
  SVD_MAX_UPLOAD_BYTES,
  SVD_RECONCILE_STALE_MS,
  SVD_RETRY_COOLDOWN_MS,
  isSvdConfigured,
} from "@/lib/svd/config";
import {
  buildSvdContext,
  SvdContextError,
} from "@/lib/svd/context-mapper";
import { computeOverall } from "@/lib/svd/overall";
import {
  isMandatoryDocumentTipo,
  isSvdContentType,
  mapSvdResultadoToStatus,
  MANDATORY_DOCUMENT_TIPOS,
  type DocumentVerificationStatus,
  type MandatoryDocumentTipo,
  type SvdWebhookPayload,
  type VerificationOverall,
} from "@/lib/svd/types";

export class DocumentVerificationServiceError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "DocumentVerificationServiceError";
    this.status = status;
    this.code = code;
  }
}

export type DocumentStatusItem = {
  tipo: MandatoryDocumentTipo;
  status: DocumentVerificationStatus | "absent";
  resultadoSvd: string | null;
  scoreLectura: string | null;
  scoreAutenticidad: string | null;
  fechaVencimiento: string | null;
  lastError: string | null;
  submittedAt: string | null;
};

export type DocumentStatusResponse = {
  overall: VerificationOverall;
  documents: DocumentStatusItem[];
  svdConfigured: boolean;
};

function extensionForContentType(ct: string): string {
  if (ct === "image/png") return "png";
  if (ct === "application/pdf") return "pdf";
  return "jpg";
}

function sniffContentType(
  mimeFromClient: string | null,
  filename: string,
): string | null {
  const lower = filename.toLowerCase();
  if (mimeFromClient && isSvdContentType(mimeFromClient)) {
    return mimeFromClient;
  }
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return null;
}

/**
 * Aplica un resultado terminal del SVD a la fila local.
 *
 * LIMITACIÓN CONOCIDA (MVP): el webhook SVD no incluye id de intento — solo
 * transportista_id + tipo_documento + resultado. Un webhook TARDÍO del intento
 * N puede sobrescribir el estado tras un reintento N+1. Mitigación: cooldown
 * corto en submitDocument. Sin solución perfecta sin cambiar el contrato SVD.
 */
export async function applySvdResult(input: {
  transportistaId: number;
  tipoDocumento: string;
  resultado: string;
  scoreLectura?: string | null;
  scoreAutenticidad?: string | null;
  fechaVencimiento?: string | null;
  svdDocumentoId?: string | null;
}): Promise<void> {
  if (!isMandatoryDocumentTipo(input.tipoDocumento)) {
    return;
  }

  const status = mapSvdResultadoToStatus(input.resultado);
  const existing =
    await documentVerificationRepository.getByTransportistaAndTipo(
      input.transportistaId,
      input.tipoDocumento,
    );

  if (
    existing &&
    existing.resultadoSvd === input.resultado &&
    (existing.scoreLectura ?? null) === (input.scoreLectura ?? null) &&
    (existing.scoreAutenticidad ?? null) === (input.scoreAutenticidad ?? null) &&
    existing.status === status
  ) {
    return;
  }

  const terminal =
    status === "aprobado" ||
    status === "rechazado" ||
    status === "revision_manual";

  await documentVerificationRepository.upsertByTipo({
    transportistaId: input.transportistaId,
    tipoDocumento: input.tipoDocumento,
    status,
    resultadoSvd: input.resultado,
    scoreLectura: input.scoreLectura ?? null,
    scoreAutenticidad: input.scoreAutenticidad ?? null,
    fechaVencimiento: input.fechaVencimiento ?? null,
    svdDocumentoId: input.svdDocumentoId,
    lastError: null,
    completedAt: terminal ? new Date() : null,
  });
}

async function reconcileStaleIfNeeded(
  transportistaId: number,
  svdExternalId: string,
): Promise<void> {
  const rows =
    await documentVerificationRepository.getByTransportistaId(transportistaId);
  const now = Date.now();
  const stale = rows.filter((row) => {
    if (row.status !== "submitted" && row.status !== "processing") {
      return false;
    }
    const anchor = row.submittedAt ?? row.updatedAt;
    return now - anchor.getTime() >= SVD_RECONCILE_STALE_MS;
  });

  if (stale.length === 0) {
    return;
  }

  try {
    const listed = await listarVerificaciones(svdExternalId);
    // Campo real del API: items[].documento.tipo_documento (ver Documento + model_dump).
    for (const tipo of MANDATORY_DOCUMENT_TIPOS) {
      const matching = listed.items
        .filter(
          (item) =>
            item.documento?.tipo_documento === tipo && item.historial != null,
        )
        .sort((a, b) => {
          const ta = a.historial?.procesado_en ?? "";
          const tb = b.historial?.procesado_en ?? "";
          return tb.localeCompare(ta);
        });

      const best = matching[0];
      if (!best?.historial) continue;

      await applySvdResult({
        transportistaId,
        tipoDocumento: tipo,
        resultado: String(best.historial.resultado),
        scoreLectura: best.historial.score_lectura ?? null,
        scoreAutenticidad: best.historial.score_autenticidad ?? null,
        fechaVencimiento: best.historial.fecha_vencimiento ?? null,
        svdDocumentoId: best.documento.id,
      });
    }
  } catch (err) {
    console.error("[svd] reconcile failed", {
      transportistaId,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

export const documentVerificationService = {
  getStatus: async (userId: number): Promise<DocumentStatusResponse> => {
    const configured = isSvdConfigured();
    const transportista = await transportistaRepository.getByUserId(userId);
    if (!transportista) {
      throw new DocumentVerificationServiceError(
        "Perfil de transportista no encontrado",
        404,
      );
    }

    if (configured) {
      await reconcileStaleIfNeeded(
        transportista.id,
        transportista.svdExternalId,
      );
    }

    const rows =
      await documentVerificationRepository.getByTransportistaId(
        transportista.id,
      );
    const byTipo: Partial<
      Record<MandatoryDocumentTipo, DocumentVerificationStatus | null>
    > = {};
    const documents: DocumentStatusItem[] = MANDATORY_DOCUMENT_TIPOS.map(
      (tipo) => {
        const row = rows.find((r) => r.tipoDocumento === tipo);
        byTipo[tipo] = row?.status ?? null;
        return {
          tipo,
          status: row?.status ?? "absent",
          resultadoSvd: row?.resultadoSvd ?? null,
          scoreLectura: row?.scoreLectura ?? null,
          scoreAutenticidad: row?.scoreAutenticidad ?? null,
          fechaVencimiento: row?.fechaVencimiento ?? null,
          lastError: row?.lastError ?? null,
          submittedAt: row?.submittedAt?.toISOString() ?? null,
        };
      },
    );

    return {
      overall: computeOverall(byTipo),
      documents,
      svdConfigured: configured,
    };
  },

  submitDocument: async (
    userId: number,
    tipoRaw: string,
    file: Buffer,
    filename: string,
    mimeFromClient: string | null,
  ) => {
    if (!isSvdConfigured()) {
      throw new DocumentVerificationServiceError(
        "SVD no está configurado en el servidor",
        503,
        "SVD_NOT_CONFIGURED",
      );
    }

    if (!isMandatoryDocumentTipo(tipoRaw)) {
      throw new DocumentVerificationServiceError(
        "Tipo de documento no permitido",
        400,
      );
    }
    const tipo = tipoRaw;

    if (file.byteLength < 1 || file.byteLength > SVD_MAX_UPLOAD_BYTES) {
      throw new DocumentVerificationServiceError(
        "El archivo debe pesar entre 1 byte y 10 MB",
        400,
      );
    }

    const contentType = sniffContentType(mimeFromClient, filename);
    if (!contentType || !isSvdContentType(contentType)) {
      throw new DocumentVerificationServiceError(
        "Formato no permitido. Usa JPG, PNG o PDF.",
        400,
      );
    }

    const transportista = await transportistaRepository.getByUserId(userId);
    if (!transportista) {
      throw new DocumentVerificationServiceError(
        "Perfil de transportista no encontrado",
        404,
      );
    }

    const existing =
      await documentVerificationRepository.getByTransportistaAndTipo(
        transportista.id,
        tipo,
      );

    if (existing?.status === "aprobado") {
      throw new DocumentVerificationServiceError(
        "Este documento ya fue aprobado",
        409,
      );
    }

    if (existing?.submittedAt) {
      const elapsed = Date.now() - existing.submittedAt.getTime();
      if (elapsed < SVD_RETRY_COOLDOWN_MS) {
        throw new DocumentVerificationServiceError(
          "Espera unos segundos antes de reintentar este documento",
          429,
          "RETRY_COOLDOWN",
        );
      }
    }

    if (
      existing &&
      (existing.status === "submitted" || existing.status === "processing") &&
      existing.submittedAt &&
      Date.now() - existing.submittedAt.getTime() < SVD_RECONCILE_STALE_MS
    ) {
      throw new DocumentVerificationServiceError(
        "Este documento ya está en proceso de verificación",
        409,
      );
    }

    const flotas = await flotaRepository.getByTransportista(transportista.id);
    const placa = flotas[0]?.placa ?? null;

    let context;
    try {
      context = buildSvdContext(tipo, {
        cedula: transportista.cedula,
        nombre: transportista.nombre,
        apellido: transportista.apellido,
        placa,
      });
    } catch (err) {
      if (err instanceof SvdContextError) {
        throw new DocumentVerificationServiceError(err.message, 400);
      }
      throw err;
    }

    const now = new Date();
    try {
      const presign = await generarUrl(contentType);
      await uploadToPresignedPost(
        presign.url,
        presign.fields,
        file,
        filename || `doc.${extensionForContentType(contentType)}`,
        contentType,
      );
      const created = await crearVerificacion({
        transportistaId: transportista.svdExternalId,
        tipoDocumento: tipo,
        s3KeyRaw: presign.s3_key,
        context,
      });

      await documentVerificationRepository.upsertByTipo({
        transportistaId: transportista.id,
        tipoDocumento: tipo,
        status: "processing",
        svdDocumentoId: created.documento_id,
        s3KeyRaw: presign.s3_key,
        resultadoSvd: null,
        scoreLectura: null,
        scoreAutenticidad: null,
        fechaVencimiento: null,
        lastError: null,
        submittedAt: now,
        completedAt: null,
      });

      return {
        tipo,
        status: "processing" as const,
        documentoId: created.documento_id,
      };
    } catch (err) {
      const message =
        err instanceof SvdClientError || err instanceof Error
          ? err.message
          : "Error al enviar documento al SVD";
      const status =
        err instanceof SvdClientError
          ? err.status
          : err instanceof DocumentVerificationServiceError
            ? err.status
            : 502;

      await documentVerificationRepository.upsertByTipo({
        transportistaId: transportista.id,
        tipoDocumento: tipo,
        status: existing?.status === "rechazado" ? "rechazado" : "pending",
        lastError: message,
        submittedAt: existing?.submittedAt ?? null,
      });

      throw new DocumentVerificationServiceError(message, status);
    }
  },

  applyWebhookPayload: async (payload: SvdWebhookPayload): Promise<void> => {
    const transportista =
      await documentVerificationRepository.getTransportistaBySvdExternalId(
        payload.transportista_id,
      );
    if (!transportista) {
      console.warn("[svd] webhook transportista desconocido", {
        transportista_id: payload.transportista_id,
      });
      return;
    }

    await applySvdResult({
      transportistaId: transportista.id,
      tipoDocumento: payload.tipo_documento,
      resultado: String(payload.resultado),
      scoreLectura: payload.score_lectura ?? null,
      scoreAutenticidad: payload.score_autenticidad ?? null,
      fechaVencimiento: payload.fecha_vencimiento ?? null,
    });
  },
};
