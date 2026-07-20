import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifica X-SVD-Signature: sha256=<hex> sobre el body crudo (UTF-8 bytes).
 */
export function verifySvdWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const match = /^sha256=([0-9a-fA-F]+)$/.exec(signatureHeader.trim());
  if (!match) {
    return false;
  }

  const providedHex = match[1].toLowerCase();
  const bodyBuf = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(rawBody, "utf8");
  const expectedHex = createHmac("sha256", secret)
    .update(bodyBuf)
    .digest("hex");

  try {
    const a = Buffer.from(providedHex, "hex");
    const b = Buffer.from(expectedHex, "hex");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
