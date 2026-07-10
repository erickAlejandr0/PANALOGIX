import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveViajeMovePlan } from "@/lib/dev/viaje-move-plan";
import { FASE_VIAJE } from "@/lib/fletes/constants";
import {
  haversineMeters,
  isWithinArrivalRadius,
  PROXIMITY_ARRIVAL_RADIUS_M,
} from "@/lib/viajes/proximity";

test("resolveViajeMovePlan mapea hacia_origen a recogida en origen", () => {
  const plan = resolveViajeMovePlan(FASE_VIAJE.HACIA_ORIGEN);
  assert.equal(plan.kind, "move");
  if (plan.kind !== "move") return;
  assert.equal(plan.target, "origen");
  assert.equal(plan.transition, "confirmar_recogida");
});

test("resolveViajeMovePlan mapea hacia_destino a llegada en destino", () => {
  const plan = resolveViajeMovePlan(FASE_VIAJE.HACIA_DESTINO);
  assert.equal(plan.kind, "move");
  if (plan.kind !== "move") return;
  assert.equal(plan.target, "destino");
  assert.equal(plan.transition, "anunciar_llegada");
});

test("resolveViajeMovePlan bloquea asignado hasta iniciar desde la UI", () => {
  const plan = resolveViajeMovePlan(FASE_VIAJE.ASIGNADO);
  assert.equal(plan.kind, "blocked");
});

test("resolveViajeMovePlan bloquea inspeccion y posteriores", () => {
  for (const fase of [
    FASE_VIAJE.EN_DESTINO,
    FASE_VIAJE.INSPECCION,
    FASE_VIAJE.CODIGO_PENDIENTE,
    FASE_VIAJE.RESUMEN,
  ]) {
    const plan = resolveViajeMovePlan(fase);
    assert.equal(plan.kind, "blocked", `fase ${fase}`);
  }
});

test("isWithinArrivalRadius acepta el mismo punto del geom", () => {
  const geom = {
    type: "Point",
    coordinates: [-79.5199, 8.9824],
  };
  assert.equal(
    isWithinArrivalRadius({ lng: -79.5199, lat: 8.9824 }, geom),
    true,
  );
});

test("haversineMeters distingue puntos fuera del radio de llegada", () => {
  const distance = haversineMeters(
    { lng: -79.5199, lat: 8.9824 },
    { lng: -79.4199, lat: 8.9824 },
  );
  assert.ok(distance > PROXIMITY_ARRIVAL_RADIUS_M);
});
