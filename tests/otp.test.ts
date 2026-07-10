import assert from "node:assert/strict";
import { test } from "node:test";

import { formatMmSs } from "@/lib/entregas/otp";

test("formatMmSs formatea mm:ss con relleno de ceros", () => {
  assert.equal(formatMmSs(0), "00:00");
  assert.equal(formatMmSs(5), "00:05");
  assert.equal(formatMmSs(65), "01:05");
  assert.equal(formatMmSs(600), "10:00");
  assert.equal(formatMmSs(3599), "59:59");
});

test("formatMmSs nunca produce valores negativos", () => {
  assert.equal(formatMmSs(-1), "00:00");
  assert.equal(formatMmSs(-120), "00:00");
});

test("formatMmSs trunca fracciones de segundo", () => {
  assert.equal(formatMmSs(59.9), "00:59");
  assert.equal(formatMmSs(90.4), "01:30");
});
