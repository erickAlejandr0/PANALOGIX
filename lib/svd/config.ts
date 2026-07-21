/** Configuración server-only del cliente SVD. */

// Antigüedad mínima antes de reconciliar contra la API de SVD. El worker
// suele terminar en <1 min; con el polling del panel (2.5 s) esto acota la
// espera sin webhook a ~35 s tras completarse el procesamiento.
export const SVD_RECONCILE_STALE_MS = 35_000;
export const SVD_RETRY_COOLDOWN_MS = 5_000;
export const SVD_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const SVD_FETCH_TIMEOUT_MS = 30_000;

export function getSvdApiBaseUrl(): string | null {
  const raw = process.env.SVD_API_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function getSvdApiKey(): string | null {
  const raw = process.env.SVD_API_KEY?.trim();
  return raw || null;
}

export function getSvdWebhookSecret(): string | null {
  const raw = process.env.SVD_WEBHOOK_HMAC_SECRET?.trim();
  return raw || null;
}

export function isSvdConfigured(): boolean {
  return Boolean(getSvdApiBaseUrl() && getSvdApiKey());
}
