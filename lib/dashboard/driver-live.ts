import type { ViajeFaseUpdatedPayload } from "@/lib/events/types";
import { FASE_VIAJE } from "@/lib/fletes/constants";
import type { DriverRow } from "@/lib/dashboard/driver-table";

export function patchDriverFromFase(
  driver: DriverRow,
  payload: ViajeFaseUpdatedPayload,
): DriverRow {
  const delivered = isEntregaCompletadaFase(payload.fase);

  return {
    ...driver,
    fase: payload.fase,
    estadoLabel: delivered ? "Entrega completada" : payload.faseLabel,
    isDelivered: delivered,
    secondaryText: delivered
      ? "Pago procesado"
      : driver.secondaryText,
  };
}

export function markDriverEntregaCompletada(driver: DriverRow): DriverRow {
  return {
    ...driver,
    fase: FASE_VIAJE.RESUMEN,
    estadoLabel: "Entrega completada",
    isDelivered: true,
    secondaryText: "Pago procesado",
  };
}

export function isEntregaCompletadaFase(fase: string): boolean {
  return fase === FASE_VIAJE.RESUMEN || fase === FASE_VIAJE.COMPLETADO;
}
