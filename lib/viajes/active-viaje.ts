import type { ActiveViajeRow } from "@/repositories/viajeRepository";
import {
  parseStoredChecklist,
  toTransportistaChecklistItems,
} from "@/lib/entregas/inspeccion-checklist";
import { getPointCoordinates } from "@/lib/mapbox/geometry";
import { FASE_VIAJE, type FaseViaje } from "@/lib/fletes/constants";
import type { ViajeInspeccionChecklistItemPayload } from "@/lib/events/types";
import { getFaseLabel } from "@/lib/viajes/transitions";

export type ActiveViajeDetail = {
  viajeId: number;
  publicacionId: number;
  postulacionId: number;
  fase: FaseViaje;
  codigo: string;
  nombreEmpresa: string;
  origenNombre: string;
  destinoNombre: string;
  origen: { lng: number; lat: number };
  destino: { lng: number; lat: number };
  totalPago: string;
  peso: number;
  fechaSalida: string;
  inspeccionChecklist?: ViajeInspeccionChecklistItemPayload[];
};

export function mapActiveViajeRow(row: ActiveViajeRow): ActiveViajeDetail | null {
  const origen = getPointCoordinates(row.origen_geom);
  const destino = getPointCoordinates(row.destino_geom);

  if (!origen || !destino) {
    return null;
  }

  const fase = row.fase as FaseViaje;
  const storedChecklist = parseStoredChecklist(row.inspeccion_checklist);
  const inspeccionChecklist =
    fase === FASE_VIAJE.INSPECCION && storedChecklist
      ? toTransportistaChecklistItems(storedChecklist)
      : undefined;

  return {
    viajeId: row.id,
    publicacionId: row.id_publicacion,
    postulacionId: row.id_postulacion,
    fase,
    codigo: row.codigo,
    nombreEmpresa: row.nombre_empresa,
    origenNombre: row.origen_nombre,
    destinoNombre: row.destino_nombre,
    origen: { lng: origen[0], lat: origen[1] },
    destino: { lng: destino[0], lat: destino[1] },
    totalPago: row.total_pago,
    peso: row.peso,
    fechaSalida: row.fecha_salida,
    ...(inspeccionChecklist ? { inspeccionChecklist } : {}),
  };
}

export function toViajeFasePayload(
  detail: ActiveViajeDetail,
  transportistaId: number,
) {
  return {
    viajeId: detail.viajeId,
    publicacionId: detail.publicacionId,
    transportistaId,
    fase: detail.fase,
    faseLabel: getFaseLabel(detail.fase),
    codigo: detail.codigo,
    nombreEmpresa: detail.nombreEmpresa,
    origenNombre: detail.origenNombre,
    destinoNombre: detail.destinoNombre,
    origen: detail.origen,
    destino: detail.destino,
    totalPago: detail.totalPago,
  };
}

export function toPostulacionAcceptedPayload(
  detail: ActiveViajeDetail,
  transportistaId: number,
) {
  return {
    postulacionId: detail.postulacionId,
    publicacionId: detail.publicacionId,
    viajeId: detail.viajeId,
    transportistaId,
    codigo: detail.codigo,
    nombreEmpresa: detail.nombreEmpresa,
    origenNombre: detail.origenNombre,
    destinoNombre: detail.destinoNombre,
    origen: detail.origen,
    destino: detail.destino,
    totalPago: detail.totalPago,
    peso: detail.peso,
    fechaSalida: detail.fechaSalida,
    fase: detail.fase,
  };
}
