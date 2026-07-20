import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildSvdContext,
  SvdContextError,
} from "@/lib/svd/context-mapper";

const profile = {
  cedula: "8-123-456",
  nombre: "Juan",
  apellido: "Pérez",
  placa: "AB1234",
};

test("cedula y licencia envían identidad sin placa", () => {
  assert.deepEqual(buildSvdContext("cedula", profile), {
    cedula_registrada: "8-123-456",
    nombre_registrado: "Juan Pérez",
  });
  assert.deepEqual(buildSvdContext("licencia", profile), {
    cedula_registrada: "8-123-456",
    nombre_registrado: "Juan Pérez",
  });
});

test("soat envía placa y nombre, no cédula", () => {
  const ctx = buildSvdContext("soat", profile);
  assert.equal(ctx.placa_registrada, "AB1234");
  assert.equal(ctx.nombre_registrado, "Juan Pérez");
  assert.equal(ctx.cedula_registrada, undefined);
});

test("revisado solo placa", () => {
  assert.deepEqual(buildSvdContext("revisado", profile), {
    placa_registrada: "AB1234",
  });
});

test("soat sin placa falla", () => {
  assert.throws(
    () => buildSvdContext("soat", { ...profile, placa: null }),
    SvdContextError,
  );
});

test("licencia sin cédula falla", () => {
  assert.throws(
    () => buildSvdContext("licencia", { ...profile, cedula: "  " }),
    SvdContextError,
  );
});
