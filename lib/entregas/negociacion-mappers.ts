import { ESTADO_VIAJE_NOMBRE, FASE_VIAJE } from "@/lib/fletes/constants";
import { resolveInspeccionChecklist } from "@/lib/entregas/inspeccion-checklist";
import { formatDeliveryDate } from "@/lib/mapbox/geometry";
import type {
  EntregaEstado,
  EntregaListItem,
  EntregasPageData,
  InspeccionCargaData,
} from "@/lib/entregas/types";
import type {
  EntregaListRow,
  InspeccionContextRow,
} from "@/repositories/entregasRepository";

export { buildDefaultChecklist } from "@/lib/entregas/inspeccion-checklist";

function formatPanamaTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-PA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Panama",
  });
}

export function deriveEntregaEstado(
  fase: string,
  estadoViaje: string,
): EntregaEstado {
  if (estadoViaje === ESTADO_VIAJE_NOMBRE.CANCELADO) {
    return "cancelada";
  }

  if (
    estadoViaje === ESTADO_VIAJE_NOMBRE.COMPLETADO ||
    fase === FASE_VIAJE.RESUMEN ||
    fase === FASE_VIAJE.COMPLETADO
  ) {
    return "completada";
  }

  switch (fase) {
    case FASE_VIAJE.HACIA_DESTINO:
      return "en_camino";
    case FASE_VIAJE.EN_DESTINO:
    case FASE_VIAJE.INSPECCION:
    case FASE_VIAJE.CODIGO_PENDIENTE:
      return "en_destino";
    default:
      return "por_recoger";
  }
}

const ESTADO_RECEPTOR_LABEL: Record<EntregaEstado, string> = {
  por_recoger: "Pendiente de recogida",
  en_camino: "En tránsito",
  en_destino: "En punto de entrega",
  completada: "Entrega completada",
  cancelada: "Entrega cancelada",
};

export function entregaStatusLabel(estado: EntregaEstado): string {
  return ESTADO_RECEPTOR_LABEL[estado];
}

export function mapEntregaListItem(row: EntregaListRow): EntregaListItem {
  const estado = deriveEntregaEstado(row.fase, row.estado_viaje);
  const enDestino = estado === "en_destino";

  return {
    id: String(row.id),
    viajeId: row.id,
    codigo: row.codigo,
    estado,
    nuevo: enDestino,
    origen: row.origen_nombre,
    destino: row.destino_nombre,
    empresa: `${row.nombre_transportista} ${row.apellido_transportista}`.trim(),
    receptor: entregaStatusLabel(estado),
    pesoKg: row.peso,
    llegadaLabel: enDestino
      ? `Llegada ${formatPanamaTime(row.updated_at)}`
      : undefined,
  };
}

function countByEstado(items: EntregaListItem[]): Record<EntregaEstado, number> {
  const counts: Record<EntregaEstado, number> = {
    por_recoger: 0,
    en_camino: 0,
    en_destino: 0,
    completada: 0,
    cancelada: 0,
  };
  for (const item of items) {
    counts[item.estado] += 1;
  }
  return counts;
}

export function countEntregasByEstado(
  items: EntregaListItem[],
): Record<EntregaEstado, number> {
  return countByEstado(items);
}

export function buildEntregasPageData(rows: EntregaListRow[]): EntregasPageData {
  const items = rows.map(mapEntregaListItem);
  return {
    items,
    totalHoy: items.length,
    counts: countByEstado(items),
  };
}

export function mapInspeccionCargaData(
  row: InspeccionContextRow,
): InspeccionCargaData {
  const estado =
    row.fase === FASE_VIAJE.CODIGO_PENDIENTE ||
    row.fase === FASE_VIAJE.RESUMEN
      ? "completada"
      : "en_revision";

  return {
    codigo: row.codigo,
    pasoActual: 1,
    pasosTotal: 3,
    estado,
    flete: {
      codigo: row.codigo,
      pesoKg: row.peso,
      pago: Number.parseFloat(row.total_pago),
      tipoCarga: row.tipo_carga,
      fechaEntrega: formatDeliveryDate(row.fecha_entrega_estimada),
      origen: row.origen_nombre,
      destino: row.destino_nombre,
      receptor: row.nombre_empresa,
      completadaEn: "",
    },
    transportista: {
      nombre: row.nombre_transportista,
      apellido: row.apellido_transportista,
      placa: row.placa,
      cedula: row.cedula,
      vehiculo: row.vehiculo,
      iniciadaAt: formatPanamaTime(
        row.inspeccion_iniciada_at ?? row.updated_at,
      ),
      iniciadaHace: "",
    },
    checklist: resolveInspeccionChecklist(row.inspeccion_checklist),
  };
}
