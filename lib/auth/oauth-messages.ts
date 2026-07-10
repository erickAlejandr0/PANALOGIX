const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  session_expired: "Tu sesión expiró, inicia sesión nuevamente",
  oauth_failed: "No se pudo completar la autenticación con Google. Intenta de nuevo.",
  oauth_denied: "Cancelaste el inicio de sesión con Google.",
  account_not_found: "No tienes cuenta. Regístrate primero.",
  google_email_unverified: "Tu email de Google no está verificado.",
  invalid_params: "Parámetros de autenticación inválidos.",
};

const OAUTH_SUCCESS_MESSAGES: Record<string, string> = {
  true: "Registro exitoso, ahora inicia sesión",
  google_linked: "Tu cuenta fue vinculada con Google correctamente.",
};

export function getOAuthErrorMessage(error?: string): string | null {
  if (!error) return null;
  return OAUTH_ERROR_MESSAGES[error] ?? null;
}

export function getOAuthSuccessMessage(success?: string): string | null {
  if (!success) return null;
  return OAUTH_SUCCESS_MESSAGES[success] ?? null;
}
