import assert from "node:assert/strict";
import { test } from "node:test";

import { ESTADO_VIAJE_NOMBRE, FASE_VIAJE } from "@/lib/fletes/constants";
import {
  buildDefaultChecklist,
  buildEntregasPageData,
  deriveEntregaEstado,
  mapEntregaListItem,
} from "@/lib/entregas/negociacion-mappers";
import type { EntregaListRow } from "@/repositories/entregasRepository";

function makeRow(overrides: Partial<EntregaListRow> = {}): EntregaListRow {
  return {
    id: 1,
    fase: FASE_VIAJE.HACIA_DESTINO,
    estado_viaje: ESTADO_VIAJE_NOMBRE.EN_CURSO,
    codigo: "FLT-001",
    origen_nombre: "Ciudad de Panamá",
    destino_nombre: "Colón",
    peso: 1200,
    nombre_transportista: "Juan",
    apellido_transportista: "Pérez",
    updated_at: "2026-03-10T14:30:00.000Z",
    ...overrides,
  };
}

test("deriveEntregaEstado prioriza la cancelacion sobre la fase", () => {
  assert.equal(
    deriveEntregaEstado(FASE_VIAJE.INSPECCION, ESTADO_VIAJE_NOMBRE.CANCELADO),
    "cancelada",
  );
});

test("deriveEntregaEstado mapea el transito a 'en_camino'", () => {
  assert.equal(
    deriveEntregaEstado(FASE_VIAJE.HACIA_DESTINO, ESTADO_VIAJE_NOMBRE.EN_CURSO),
    "en_camino",
  );
});

test("deriveEntregaEstado agrupa fases de negociacion en 'en_destino'", () => {
  for (const fase of [
    FASE_VIAJE.EN_DESTINO,
    FASE_VIAJE.INSPECCION,
    FASE_VIAJE.CODIGO_PENDIENTE,
  ]) {
    assert.equal(
      deriveEntregaEstado(fase, ESTADO_VIAJE_NOMBRE.EN_CURSO),
      "en_destino",
      `fase ${fase} deberia ser en_destino`,
    );
  }
});

test("deriveEntregaEstado marca resumen y completado como 'completada'", () => {
  assert.equal(
    deriveEntregaEstado(FASE_VIAJE.RESUMEN, ESTADO_VIAJE_NOMBRE.EN_CURSO),
    "completada",
  );
  assert.equal(
    deriveEntregaEstado(FASE_VIAJE.RESUMEN, ESTADO_VIAJE_NOMBRE.COMPLETADO),
    "completada",
  );
  assert.equal(
    deriveEntregaEstado(FASE_VIAJE.COMPLETADO, ESTADO_VIAJE_NOMBRE.COMPLETADO),
    "completada",
  );
});

test("deriveEntregaEstado usa 'por_recoger' como estado por defecto", () => {
  assert.equal(
    deriveEntregaEstado(FASE_VIAJE.ASIGNADO, ESTADO_VIAJE_NOMBRE.EN_CURSO),
    "por_recoger",
  );
  assert.equal(
    deriveEntregaEstado(FASE_VIAJE.HACIA_ORIGEN, ESTADO_VIAJE_NOMBRE.EN_CURSO),
    "por_recoger",
  );
});

test("mapEntregaListItem compone el item y marca 'nuevo' al llegar", () => {
  const item = mapEntregaListItem(
    makeRow({ id: 7, fase: FASE_VIAJE.EN_DESTINO }),
  );
  assert.equal(item.id, "7");
  assert.equal(item.viajeId, 7);
  assert.equal(item.estado, "en_destino");
  assert.equal(item.nuevo, true);
  assert.equal(item.empresa, "Juan Pérez");
  assert.ok(item.llegadaLabel?.startsWith("Llegada "));
});

test("mapEntregaListItem no marca 'nuevo' ni llegada fuera del destino", () => {
  const item = mapEntregaListItem(makeRow({ fase: FASE_VIAJE.HACIA_DESTINO }));
  assert.equal(item.estado, "en_camino");
  assert.equal(item.nuevo, false);
  assert.equal(item.llegadaLabel, undefined);
});

test("buildEntregasPageData agrega totales y conteos por estado", () => {
  const data = buildEntregasPageData([
    makeRow({ id: 1, fase: FASE_VIAJE.HACIA_DESTINO }),
    makeRow({ id: 2, fase: FASE_VIAJE.EN_DESTINO }),
    makeRow({ id: 3, fase: FASE_VIAJE.CODIGO_PENDIENTE }),
    makeRow({ id: 5, fase: FASE_VIAJE.RESUMEN }),
    makeRow({
      id: 4,
      fase: FASE_VIAJE.INSPECCION,
      estado_viaje: ESTADO_VIAJE_NOMBRE.CANCELADO,
    }),
  ]);

  assert.equal(data.totalHoy, 5);
  assert.equal(data.items.length, 5);
  assert.equal(data.counts.en_camino, 1);
  assert.equal(data.counts.en_destino, 2);
  assert.equal(data.counts.completada, 1);
  assert.equal(data.counts.cancelada, 1);
  assert.equal(data.counts.por_recoger, 0);
});

test("buildDefaultChecklist entrega la guia de inspeccion local completa", () => {
  const checklist = buildDefaultChecklist();
  assert.equal(checklist.length, 4);
  assert.ok(checklist.every((item) => item.completed === false));
  assert.deepEqual(
    checklist.map((item) => item.id),
    ["sellos", "transportista", "fotos", "fecha"],
  );
});
