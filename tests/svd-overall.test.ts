import assert from "node:assert/strict";
import { test } from "node:test";

import { computeOverall } from "@/lib/svd/overall";
import type { DocumentVerificationStatus } from "@/lib/svd/types";

function statuses(
  partial: Partial<Record<string, DocumentVerificationStatus | null>>,
) {
  return {
    cedula: partial.cedula ?? null,
    licencia: partial.licencia ?? null,
    soat: partial.soat ?? null,
    revisado: partial.revisado ?? null,
  };
}

test("needs_retry gana sobre incomplete", () => {
  assert.equal(
    computeOverall(
      statuses({
        cedula: "rechazado",
        licencia: null,
        soat: "aprobado",
        revisado: "aprobado",
      }),
    ),
    "needs_retry",
  );
});

test("incomplete cuando falta subir y nada rechazado", () => {
  assert.equal(
    computeOverall(
      statuses({
        cedula: "aprobado",
        licencia: "pending",
        soat: "aprobado",
        revisado: "aprobado",
      }),
    ),
    "incomplete",
  );
});

test("manual_review cuando hay revision y nada rechazado/incompleto", () => {
  assert.equal(
    computeOverall(
      statuses({
        cedula: "aprobado",
        licencia: "aprobado",
        soat: "revision_manual",
        revisado: "aprobado",
      }),
    ),
    "manual_review",
  );
});

test("processing cuando hay submitted/processing", () => {
  assert.equal(
    computeOverall(
      statuses({
        cedula: "aprobado",
        licencia: "processing",
        soat: "aprobado",
        revisado: "aprobado",
      }),
    ),
    "processing",
  );
});

test("completed solo con los 4 aprobados", () => {
  assert.equal(
    computeOverall(
      statuses({
        cedula: "aprobado",
        licencia: "aprobado",
        soat: "aprobado",
        revisado: "aprobado",
      }),
    ),
    "completed",
  );
});
