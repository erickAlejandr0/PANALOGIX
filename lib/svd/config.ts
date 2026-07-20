/** Configuración server-only del cliente SVD. */

export const SVD_RECONCILE_STALE_MS = 150_000; // 2.5 min
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
