import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatCurrencyUsd,
  formatFechaSalida,
  formatPesoLabel,
  formatPostulacionesLabel,
  formatRelativePublicationTime,
  formatRelativeTimeShort,
  formatRouteLabel,
  getApplicantInitials,
} from "@/lib/publicaciones/format";

test("getApplicantInitials toma iniciales y cae a '?' si no hay datos", () => {
  assert.equal(getApplicantInitials("Juan", "Perez"), "JP");
  assert.equal(getApplicantInitials("  ana ", " gomez "), "AG");
  assert.equal(getApplicantInitials("", ""), "?");
});

test("formatPostulacionesLabel pluraliza y oculta el cero", () => {
  assert.equal(formatPostulacionesLabel(0), null);
  assert.equal(formatPostulacionesLabel(1), "1 Postulación");
  assert.equal(formatPostulacionesLabel(4), "4 Postulaciones");
});

test("formatRouteLabel recorta a la primera parte y trunca lo largo", () => {
  const corto = formatRouteLabel("Ciudad de Panamá, Panamá", "Colón, Panamá");
  assert.equal(corto.origen, "Ciudad de Panamá");
  assert.equal(corto.destino, "Colón");

  const largo = formatRouteLabel(
    "Un nombre de origen muy largo que supera el limite, Pais",
    "B, C",
  );
  assert.ok(largo.origen.endsWith("..."));
  assert.equal(largo.origen.length, 28);
  assert.equal(largo.destino, "B");
});

test("formatPesoLabel agrega la unidad kg", () => {
  assert.equal(formatPesoLabel(500), "500 kg");
  assert.equal(formatPesoLabel(12.5), "12.5 kg");
});

test("formatCurrencyUsd formatea USD y tolera valores invalidos", () => {
  assert.equal(formatCurrencyUsd(0), "$0.00");
  assert.equal(formatCurrencyUsd(5), "$5.00");
  assert.equal(formatCurrencyUsd("12.5"), "$12.50");
  assert.equal(formatCurrencyUsd("no-numero"), "$0.00");
});

test("formatRelativePublicationTime usa el prefijo segun el estado", () => {
  const ahora = new Date().toISOString();
  assert.equal(
    formatRelativePublicationTime(ahora, "publicado"),
    "Publicado hace un momento",
  );
  assert.equal(
    formatRelativePublicationTime(ahora, "borrador"),
    "Guardado hace un momento",
  );
  assert.equal(formatRelativePublicationTime("fecha-mala", "publicado"), "");
});

test("formatRelativeTimeShort describe tiempos recientes", () => {
  assert.equal(formatRelativeTimeShort(new Date().toISOString()), "hace un momento");
  assert.equal(formatRelativeTimeShort("fecha-mala"), "");
});

test("formatFechaSalida devuelve la entrada cuando no es fecha valida", () => {
  assert.equal(formatFechaSalida("no-es-fecha"), "no-es-fecha");
  assert.ok(formatFechaSalida("2026-03-10").length > 0);
});
