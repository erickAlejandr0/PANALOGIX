import {
  getSvdApiBaseUrl,
  getSvdApiKey,
  SVD_FETCH_TIMEOUT_MS,
} from "@/lib/svd/config";
import type {
  SvdCarrierContext,
  SvdContentType,
  SvdCrearVerificacionResponse,
  SvdGenerarUrlResponse,
  SvdListVerificacionesResponse,
} from "@/lib/svd/types";

export class SvdClientError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "SvdClientError";
    this.status = status;
  }
}

function requireConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = getSvdApiBaseUrl();
  const apiKey = getSvdApiKey();
  if (!baseUrl || !apiKey) {
    throw new SvdClientError("SVD no está configurado (SVD_API_BASE_URL / SVD_API_KEY)", 503);
  }
  return { baseUrl, apiKey };
}

async function svdFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { baseUrl, apiKey } = requireConfig();
  const timeoutMs = init.timeoutMs ?? SVD_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { timeoutMs: _t, ...rest } = init;
    return await fetch(`${baseUrl}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "X-SVD-Api-Key": apiKey,
        Accept: "application/json",
        ...(rest.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new SvdClientError("Timeout al contactar el SVD", 504);
    }
    throw new SvdClientError("Error de red al contactar el SVD", 502);
  } finally {
    clearTimeout(timer);
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `SVD HTTP ${res.status}`;
  } catch {
    return `SVD HTTP ${res.status}`;
  }
}

export async function generarUrl(
  contentType: SvdContentType,
): Promise<SvdGenerarUrlResponse> {
  const res = await svdFetch("/verificaciones/generar-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: contentType }),
  });
  if (!res.ok) {
    throw new SvdClientError(await readErrorMessage(res), res.status >= 500 ? 502 : res.status);
  }
  const data = (await res.json()) as SvdGenerarUrlResponse;
  if (!data.url || !data.fields || !data.s3_key) {
    throw new SvdClientError("Respuesta inválida de generar-url");
  }
  return data;
}

/**
 * Sube el archivo al bucket raw vía presigned POST (multipart form).
 */
export async function uploadToPresignedPost(
  url: string,
  fields: Record<string, string>,
  file: Buffer,
  filename: string,
  contentType: SvdContentType,
): Promise<void> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  form.append(
    "file",
    new Blob([new Uint8Array(file)], { type: contentType }),
    filename,
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SVD_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    // S3 presigned POST suele responder 204 No Content
    if (!res.ok && res.status !== 204) {
      throw new SvdClientError(`Fallo al subir a S3 (HTTP ${res.status})`, 502);
    }
  } catch (err) {
    if (err instanceof SvdClientError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new SvdClientError("Timeout al subir el documento a S3", 504);
    }
    throw new SvdClientError("Error de red al subir el documento a S3", 502);
  } finally {
    clearTimeout(timer);
  }
}

export async function crearVerificacion(input: {
  transportistaId: string;
  tipoDocumento: string;
  s3KeyRaw: string;
  context: SvdCarrierContext;
}): Promise<SvdCrearVerificacionResponse> {
  const res = await svdFetch("/verificaciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transportista_id: input.transportistaId,
      tipo_documento: input.tipoDocumento,
      tipo_declarado: input.tipoDocumento,
      s3_key_raw: input.s3KeyRaw,
      ...input.context,
    }),
  });
  if (!res.ok) {
    throw new SvdClientError(await readErrorMessage(res), res.status >= 500 ? 502 : res.status);
  }
  const data = (await res.json()) as SvdCrearVerificacionResponse;
  if (!data.documento_id) {
    throw new SvdClientError("Respuesta inválida de POST /verificaciones");
  }
  return data;
}

/**
 * Lista documentos + último historial.
 * Campo verificado en código SVD: items[].documento.tipo_documento (snake_case).
 */
export async function listarVerificaciones(
  svdExternalId: string,
): Promise<SvdListVerificacionesResponse> {
  const res = await svdFetch(
    `/verificaciones/${encodeURIComponent(svdExternalId)}`,
    { method: "GET" },
  );
  if (!res.ok) {
    throw new SvdClientError(await readErrorMessage(res), res.status >= 500 ? 502 : res.status);
  }
  const data = (await res.json()) as SvdListVerificacionesResponse;
  if (!Array.isArray(data.items)) {
    throw new SvdClientError("Respuesta inválida de GET /verificaciones");
  }
  return data;
}
