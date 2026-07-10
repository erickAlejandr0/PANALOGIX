import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { AuthMode } from "@/lib/validations/auth";

export type OAuthStatePayload = {
  nonce: string;
  mode: AuthMode;
  roleId?: number;
};

function getStateSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  return secret;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getStateSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createOAuthState(payload: OAuthStatePayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseOAuthState(state: string): OAuthStatePayload | null {
  try {
    const [encodedPayload, signature] = state.split(".");
    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = signPayload(encodedPayload);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as OAuthStatePayload;

    if (
      !parsed.nonce ||
      (parsed.mode !== "login" && parsed.mode !== "register") ||
      (parsed.mode === "register" && typeof parsed.roleId !== "number")
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createOAuthStatePayload(
  mode: AuthMode,
  roleId?: number,
): OAuthStatePayload {
  return {
    nonce: randomBytes(16).toString("hex"),
    mode,
    ...(mode === "register" && roleId !== undefined ? { roleId } : {}),
  };
}
