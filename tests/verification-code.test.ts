import assert from "node:assert/strict";
import { test } from "node:test";

// El secreto se lee de forma perezosa dentro de las funciones, asi que basta
// con fijarlo antes de invocarlas. Nunca se persiste el codigo en claro.
process.env.NEGOCIACION_CODE_SECRET ??= "test-secret-para-suite-de-negociacion";

import { CODIGO_VERIFICACION } from "@/lib/fletes/constants";
import {
  computeExpiry,
  generateCode,
  hashCode,
  isExpired,
  verifyCode,
} from "@/lib/viajes/verification-code";

test("generateCode produce siempre un codigo numerico del largo configurado", () => {
  for (let i = 0; i < 2_000; i += 1) {
    const code = generateCode();
    assert.equal(code.length, CODIGO_VERIFICACION.LENGTH);
    assert.match(code, /^\d+$/, `codigo no numerico: ${code}`);
    const value = Number.parseInt(code, 10);
    assert.ok(value >= 0 && value < 10 ** CODIGO_VERIFICACION.LENGTH);
  }
});

test("generateCode conserva ceros a la izquierda (padStart)", () => {
  const codes = Array.from({ length: 500 }, () => generateCode());
  assert.ok(codes.every((code) => code.length === CODIGO_VERIFICACION.LENGTH));
});

test("hashCode es determinista y ligado al viaje", () => {
  const a1 = hashCode(42, "123456");
  const a2 = hashCode(42, "123456");
  assert.equal(a1, a2, "mismo viaje+codigo debe dar el mismo hash");

  const otroViaje = hashCode(43, "123456");
  assert.notEqual(a1, otroViaje, "el hash debe depender del viajeId");

  const otroCodigo = hashCode(42, "654321");
  assert.notEqual(a1, otroCodigo, "el hash debe depender del codigo");
});

test("hashCode devuelve un digest hex de sha256 (64 chars)", () => {
  const hash = hashCode(1, "000000");
  assert.equal(hash.length, 64);
  assert.match(hash, /^[0-9a-f]{64}$/);
});

test("verifyCode acepta el codigo correcto en tiempo constante", () => {
  const code = "487215";
  const stored = hashCode(7, code);
  assert.equal(verifyCode(7, code, stored), true);
});

test("verifyCode rechaza codigo incorrecto, viaje distinto o hash nulo", () => {
  const stored = hashCode(7, "487215");
  assert.equal(verifyCode(7, "000000", stored), false);
  assert.equal(verifyCode(8, "487215", stored), false);
  assert.equal(verifyCode(7, "487215", null), false);
});

test("verifyCode rechaza entradas mal formadas sin lanzar", () => {
  const stored = hashCode(7, "487215");
  assert.equal(verifyCode(7, "", stored), false);
  assert.equal(verifyCode(7, "12345", stored), false); // largo incorrecto
  assert.equal(verifyCode(7, "1234567", stored), false);
  assert.equal(verifyCode(7, "abcdef", stored), false); // no numerico
  assert.equal(verifyCode(7, "48 215", stored), false);
});

test("verifyCode no explota si el hash almacenado tiene otro largo", () => {
  assert.equal(verifyCode(7, "487215", "deadbeef"), false);
});

test("computeExpiry suma exactamente el TTL configurado", () => {
  const base = new Date("2026-01-01T00:00:00.000Z");
  const expiry = computeExpiry(base);
  assert.equal(
    expiry.getTime() - base.getTime(),
    CODIGO_VERIFICACION.TTL_MS,
  );
});

test("isExpired trata null como expirado y respeta el limite exacto", () => {
  const expira = new Date("2026-01-01T00:15:00.000Z");
  assert.equal(isExpired(null), true);
  assert.equal(
    isExpired(expira, new Date("2026-01-01T00:14:59.999Z")),
    false,
    "antes del limite no esta expirado",
  );
  assert.equal(
    isExpired(expira, new Date("2026-01-01T00:15:00.000Z")),
    false,
    "en el limite exacto (now == expira) aun es valido",
  );
  assert.equal(
    isExpired(expira, new Date("2026-01-01T00:15:00.001Z")),
    true,
    "pasado el limite esta expirado",
  );
});

test("computeExpiry + verifyCode: un codigo recien generado se valida", () => {
  const viajeId = 99;
  const code = generateCode();
  const stored = hashCode(viajeId, code);
  const expira = computeExpiry();
  assert.equal(verifyCode(viajeId, code, stored), true);
  assert.equal(isExpired(expira), false);
});
