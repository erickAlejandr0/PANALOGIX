/**
 * Base URL pública de la app como origin (`https://dominio.com`).
 * En producción debe venir de APP_URL para evitar redirects a hosts internos.
 */
export function getAppBaseUrl(requestUrl?: string): string {
  const appUrl = process.env.APP_URL?.trim();

  if (appUrl) {
    try {
      return new URL(appUrl).origin;
    } catch {
      throw new Error(
        "APP_URL must be a valid absolute URL, for example https://tu-dominio.com",
      );
    }
  }

  if (process.env.NODE_ENV !== "production" && requestUrl) {
    return new URL(requestUrl).origin;
  }

  throw new Error(
    "APP_URL environment variable is required in production and must include the URL scheme",
  );
}
