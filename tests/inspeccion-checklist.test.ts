import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildDefaultChecklist,
  countCompletedChecklist,
  isChecklistComplete,
  parseStoredChecklist,
  resolveInspeccionChecklist,
} from "../lib/entregas/inspeccion-checklist";

describe("inspeccion-checklist", () => {
  test("buildDefaultChecklist entrega 4 puntos sin completar", () => {
    const checklist = buildDefaultChecklist();
    assert.equal(checklist.length, 4);
    assert.equal(countCompletedChecklist(checklist), 0);
    assert.equal(isChecklistComplete(checklist), false);
  });

  test("parseStoredChecklist rechaza payloads invalidos", () => {
    assert.equal(parseStoredChecklist(null), null);
    assert.equal(parseStoredChecklist([{ id: "x" }]), null);
  });

  test("resolveInspeccionChecklist usa default si no hay snapshot", () => {
    const checklist = resolveInspeccionChecklist(null);
    assert.equal(checklist.length, 4);
  });

  test("isChecklistComplete exige todos los puntos incluidos los criticos", () => {
    const partial = buildDefaultChecklist().map((item, index) =>
      index < 3 ? { ...item, completed: true } : item,
    );
    assert.equal(isChecklistComplete(partial), false);

    const complete = buildDefaultChecklist().map((item) => ({
      ...item,
      completed: true,
    }));
    assert.equal(isChecklistComplete(complete), true);
  });
});
