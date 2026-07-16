/**
 * Base URL pública de la app.
 * Detrás de un reverse proxy, `request.url` puede ser localhost;
 * en producción define APP_URL=https://tu-dominio
 */
export function getAppBaseUrl(requestUrl?: string): string {
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    return appUrl.replace(/\/$/, "");
  }
  if (requestUrl) {
    return requestUrl;
  }
  throw new Error("APP_URL environment variable is not defined");
}
