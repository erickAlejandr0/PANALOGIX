import type { ViajeFaseUpdatedPayload } from "@/lib/events/types";
import { FASE_VIAJE } from "@/lib/fletes/constants";
import type { EntregaListItem } from "@/lib/entregas/types";
import { deriveEntregaEstado, entregaStatusLabel } from "@/lib/entregas/negociacion-mappers";

function formatPanamaTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-PA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Panama",
  });
}

export function patchEntregaFromFase(
  item: EntregaListItem,
  payload: ViajeFaseUpdatedPayload,
): EntregaListItem {
  const estado = deriveEntregaEstado(payload.fase, "en_curso");
  const enDestino = estado === "en_destino";
  const now = new Date().toISOString();

  return {
    ...item,
    codigo: payload.codigo,
    origen: payload.origenNombre,
    destino: payload.destinoNombre,
    estado,
    nuevo: enDestino,
    receptor: entregaStatusLabel(estado),
    llegadaLabel: enDestino ? `Llegada ${formatPanamaTime(now)}` : undefined,
  };
}

export function markEntregaCompletada(item: EntregaListItem): EntregaListItem {
  return {
    ...item,
    estado: "completada",
    nuevo: false,
    receptor: entregaStatusLabel("completada"),
    llegadaLabel: undefined,
  };
}

export function isEntregaCompletadaFase(fase: string): boolean {
  return fase === FASE_VIAJE.RESUMEN || fase === FASE_VIAJE.COMPLETADO;
}
