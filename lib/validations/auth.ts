const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const VALID_ROLE_IDS = [1, 2] as const;

export type AuthMode = "login" | "register";

export function validateLoginInput(email: string, password: string) {
  if (!email?.trim() || !password) {
    return { error: "Email y contraseña son requeridos" };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { error: "Email inválido" };
  }

  return null;
}

export function validateRegisterInput(
  email: string,
  password: string,
  roleId: number,
) {
  const loginError = validateLoginInput(email, password);
  if (loginError) {
    return loginError;
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }

  if (!VALID_ROLE_IDS.includes(roleId as (typeof VALID_ROLE_IDS)[number])) {
    return { error: "Tipo de cuenta inválido" };
  }

  if (!email || email.trim().length === 0) {
    return { error: "Email no puede estar vacío" };
  }

  if (!password || password.trim().length === 0) {
    return { error: "Contraseña no puede estar vacía" };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { error: "Email inválido" };
  }

  return null;
}

export function parseRoleId(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const roleId =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  if (Number.isNaN(roleId)) {
    return null;
  }

  return roleId;
}

export function parseAuthMode(value: string | null): AuthMode | null {
  if (value === "login" || value === "register") {
    return value;
  }
  return null;
}

export function isValidRoleId(
  roleId: number,
): roleId is (typeof VALID_ROLE_IDS)[number] {
  return VALID_ROLE_IDS.includes(roleId as (typeof VALID_ROLE_IDS)[number]);
}

export function validateGoogleWebStartParams(
  mode: AuthMode | null,
  roleId: number | null,
) {
  if (!mode) {
    return { error: "Modo de autenticación inválido" };
  }

  if (mode === "register") {
    if (roleId === null) {
      return { error: "Tipo de cuenta requerido para registro con Google" };
    }
    if (!isValidRoleId(roleId)) {
      return { error: "Tipo de cuenta inválido" };
    }
  }

  return null;
}

export function validateGoogleMobileInput(body: unknown) {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud inválido" };
  }

  const { idToken, mode, roleId } = body as {
    idToken?: unknown;
    mode?: unknown;
    roleId?: unknown;
  };

  if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
    return { error: "idToken es requerido" };
  }

  const parsedMode =
    mode === undefined || mode === null
      ? "login"
      : parseAuthMode(String(mode));

  if (!parsedMode) {
    return { error: "Modo de autenticación inválido" };
  }

  const parsedRoleId =
    roleId === undefined || roleId === null
      ? null
      : parseRoleId(roleId as string | number);

  const webValidation = validateGoogleWebStartParams(parsedMode, parsedRoleId);
  if (webValidation) {
    return webValidation;
  }

  return {
    data: {
      idToken: idToken.trim(),
      mode: parsedMode,
      roleId: parsedRoleId ?? undefined,
    },
  };
}
