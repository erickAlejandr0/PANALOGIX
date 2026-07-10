import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { CODIGO_VERIFICACION } from "@/lib/fletes/constants";

// El secreto vive solo en el servidor. Se lee de forma perezosa para que el
// modulo pueda importarse en tests que no toquen la generacion real.
function getSecret(): string {
  const secret = process.env.NEGOCIACION_CODE_SECRET;
  if (!secret) {
    throw new Error(
      "NEGOCIACION_CODE_SECRET no esta configurado en el entorno del servidor",
    );
  }
  return secret;
}

// Genera un codigo numerico uniforme usando un CSPRNG (no Math.random).
export function generateCode(): string {
  const upperBound = 10 ** CODIGO_VERIFICACION.LENGTH;
  const value = randomInt(0, upperBound);
  return value.toString().padStart(CODIGO_VERIFICACION.LENGTH, "0");
}

// Deriva el hash HMAC-SHA256 ligado al viaje. El codigo en claro nunca se
// persiste; solo se guarda este digest.
export function hashCode(viajeId: number, code: string): string {
  return createHmac("sha256", getSecret())
    .update(`${viajeId}:${code}`)
    .digest("hex");
}

// Comparacion en tiempo constante contra el hash almacenado.
export function verifyCode(
  viajeId: number,
  code: string,
  storedHash: string | null,
): boolean {
  if (!storedHash) {
    return false;
  }

  if (!/^\d+$/.test(code) || code.length !== CODIGO_VERIFICACION.LENGTH) {
    return false;
  }

  const candidate = Buffer.from(hashCode(viajeId, code), "hex");
  const stored = Buffer.from(storedHash, "hex");

  if (candidate.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(candidate, stored);
}

export function computeExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + CODIGO_VERIFICACION.TTL_MS);
}

export function isExpired(expira: Date | null, now: Date = new Date()): boolean {
  if (!expira) {
    return true;
  }
  return now.getTime() > new Date(expira).getTime();
}
