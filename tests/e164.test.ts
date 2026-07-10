import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { normalizePhoneToE164 } from "../lib/phone/e164";

describe("normalizePhoneToE164", () => {
  test("convierte teléfono local panameño con guión", () => {
    const result = normalizePhoneToE164("6657-2111");
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.e164, "+50766572111");
    }
  });

  test("convierte 8 dígitos sin prefijo", () => {
    const result = normalizePhoneToE164("66572111");
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.e164, "+50766572111");
    }
  });

  test("conserva E.164 existente", () => {
    const result = normalizePhoneToE164("+50766572111");
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.e164, "+50766572111");
    }
  });

  test("convierte prefijo 507 sin plus", () => {
    const result = normalizePhoneToE164("50766572111");
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.e164, "+50766572111");
    }
  });

  test("rechaza teléfonos demasiado cortos", () => {
    const result = normalizePhoneToE164("1234567");
    assert.equal(result.success, false);
  });

  test("rechaza teléfono vacío", () => {
    const result = normalizePhoneToE164("   ");
    assert.equal(result.success, false);
  });
});
