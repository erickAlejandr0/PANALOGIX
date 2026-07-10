export const PANAMA_COUNTRY_CODE = "507";

export type PhoneNormalizeResult =
  | { success: true; e164: string }
  | { success: false; error: string };

export function normalizePhoneToE164(
  phone: string,
  defaultCountryCode: string = PANAMA_COUNTRY_CODE,
): PhoneNormalizeResult {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { success: false, error: "Teléfono vacío" };
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) {
    return { success: false, error: "Teléfono inválido" };
  }

  let e164: string;

  if (trimmed.startsWith("+")) {
    e164 = `+${digits}`;
  } else if (
    digits.startsWith(defaultCountryCode) &&
    digits.length > defaultCountryCode.length
  ) {
    e164 = `+${digits}`;
  } else if (digits.length === 8) {
    e164 = `+${defaultCountryCode}${digits}`;
  } else {
    e164 = `+${digits}`;
  }

  const e164Digits = e164.slice(1);
  if (e164Digits.length < 8 || e164Digits.length > 15) {
    return { success: false, error: "Teléfono inválido" };
  }

  return { success: true, e164 };
}
