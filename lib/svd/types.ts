/** Tipos del contrato REST SVD (Panalogix ↔ AWS). */

export const MANDATORY_DOCUMENT_TIPOS = [
  "cedula",
  "licencia",
  "soat",
  "revisado",
] as const;

export type MandatoryDocumentTipo = (typeof MANDATORY_DOCUMENT_TIPOS)[number];

export const SVD_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export type SvdContentType = (typeof SVD_CONTENT_TYPES)[number];

export type DocumentVerificationStatus =
  | "pending"
  | "submitted"
  | "processing"
  | "aprobado"
  | "rechazado"
  | "revision_manual";

export type VerificationOverall =
  | "incomplete"
  | "processing"
  | "completed"
  | "needs_retry"
  | "manual_review";

export type SvdResultado =
  | "APROBADO"
  | "RECHAZADO"
  | "REVISION_MANUAL";

export type SvdCarrierContext = {
  cedula_registrada?: string;
  placa_registrada?: string;
  nombre_registrado?: string;
};

export type SvdGenerarUrlResponse = {
  url: string;
  fields: Record<string, string>;
  s3_key: string;
};

export type SvdCrearVerificacionResponse = {
  documento_id: string;
};

/** Respuesta real de GET /verificaciones/{id}: items[].documento.tipo_documento */
export type SvdDocumentoItem = {
  documento: {
    id: string;
    transportista_id: string;
    tipo_documento: string;
    s3_key_raw: string;
    s3_key_verified?: string | null;
    subido_en?: string;
    eliminar_despues?: string;
  };
  historial: {
    id: string;
    documento_id: string;
    tipo_detectado?: string | null;
    resultado: SvdResultado | string;
    score_lectura?: string | null;
    score_autenticidad?: string | null;
    fecha_vencimiento?: string | null;
    procesado_en?: string;
  } | null;
};

export type SvdListVerificacionesResponse = {
  items: SvdDocumentoItem[];
};

export type SvdWebhookPayload = {
  transportista_id: string;
  tipo_documento: string;
  resultado: SvdResultado | string;
  score_lectura?: string | null;
  score_autenticidad?: string | null;
  fecha_vencimiento?: string | null;
  dias_aviso?: number;
  event_type?: string;
};

export function isMandatoryDocumentTipo(
  value: string,
): value is MandatoryDocumentTipo {
  return (MANDATORY_DOCUMENT_TIPOS as readonly string[]).includes(value);
}

export function isSvdContentType(value: string): value is SvdContentType {
  return (SVD_CONTENT_TYPES as readonly string[]).includes(value);
}

export function mapSvdResultadoToStatus(
  resultado: string,
): DocumentVerificationStatus {
  switch (resultado) {
    case "APROBADO":
      return "aprobado";
    case "RECHAZADO":
      return "rechazado";
    case "REVISION_MANUAL":
      return "revision_manual";
    default:
      return "processing";
  }
}
