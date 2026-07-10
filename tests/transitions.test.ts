import assert from "node:assert/strict";
import { test } from "node:test";

import { FASE_VIAJE, type FaseViaje } from "@/lib/fletes/constants";
import { canTransitionFase, getFaseLabel } from "@/lib/viajes/transitions";

// Aristas que el flujo step-locked permite (una por paso). Cada arista se valida
// por separado para que un cambio accidental en el mapa las rompa aqui primero.
const ALLOWED_EDGES: Array<[FaseViaje, FaseViaje]> = [
  [FASE_VIAJE.ASIGNADO, FASE_VIAJE.HACIA_ORIGEN],
  [FASE_VIAJE.HACIA_ORIGEN, FASE_VIAJE.HACIA_DESTINO],
  [FASE_VIAJE.HACIA_DESTINO, FASE_VIAJE.EN_DESTINO],
  [FASE_VIAJE.EN_DESTINO, FASE_VIAJE.INSPECCION],
  [FASE_VIAJE.INSPECCION, FASE_VIAJE.CODIGO_PENDIENTE],
  [FASE_VIAJE.CODIGO_PENDIENTE, FASE_VIAJE.RESUMEN],
  [FASE_VIAJE.RESUMEN, FASE_VIAJE.COMPLETADO],
];

const ALL_FASES = Object.values(FASE_VIAJE) as FaseViaje[];

test("permite exactamente las aristas del flujo", () => {
  for (const [from, to] of ALLOWED_EDGES) {
    assert.equal(
      canTransitionFase(from, to),
      true,
      `deberia permitir ${from} -> ${to}`,
    );
  }
});

test("rechaza saltos de fase que no estan en el flujo", () => {
  // Saltarse la inspeccion, saltarse el codigo, o retroceder.
  assert.equal(canTransitionFase(FASE_VIAJE.HACIA_DESTINO, FASE_VIAJE.RESUMEN), false);
  assert.equal(canTransitionFase(FASE_VIAJE.EN_DESTINO, FASE_VIAJE.CODIGO_PENDIENTE), false);
  assert.equal(canTransitionFase(FASE_VIAJE.ASIGNADO, FASE_VIAJE.COMPLETADO), false);
  assert.equal(canTransitionFase(FASE_VIAJE.INSPECCION, FASE_VIAJE.EN_DESTINO), false);
});

test("una fase terminal no transiciona a ninguna otra", () => {
  for (const to of ALL_FASES) {
    assert.equal(
      canTransitionFase(FASE_VIAJE.COMPLETADO, to),
      false,
      `completado no deberia ir a ${to}`,
    );
  }
});

test("una fase desconocida nunca transiciona", () => {
  assert.equal(canTransitionFase("fase_inexistente", FASE_VIAJE.RESUMEN), false);
  assert.equal(canTransitionFase("", FASE_VIAJE.ASIGNADO), false);
});

test("no permite auto-transiciones (idempotencia la resuelve el service)", () => {
  for (const fase of ALL_FASES) {
    assert.equal(
      canTransitionFase(fase, fase),
      false,
      `${fase} -> ${fase} debe rechazarse a nivel de maquina de estados`,
    );
  }
});

test("canTransitionFase es puro: mismas entradas, mismo resultado", () => {
  const first = canTransitionFase(FASE_VIAJE.EN_DESTINO, FASE_VIAJE.INSPECCION);
  const second = canTransitionFase(FASE_VIAJE.EN_DESTINO, FASE_VIAJE.INSPECCION);
  assert.equal(first, second);
  assert.equal(first, true);
});

test("getFaseLabel etiqueta cada fase conocida y refleja lo desconocido", () => {
  assert.equal(getFaseLabel(FASE_VIAJE.INSPECCION), "Inspeccion de carga");
  assert.equal(getFaseLabel(FASE_VIAJE.CODIGO_PENDIENTE), "Verificacion por codigo");
  assert.equal(getFaseLabel(FASE_VIAJE.RESUMEN), "Resumen de entrega");
  assert.equal(getFaseLabel(FASE_VIAJE.COMPLETADO), "Completado");
  assert.equal(getFaseLabel("otra_cosa"), "otra_cosa");
});
