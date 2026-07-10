import { FASE_VIAJE } from "@/lib/fletes/constants";

export type MoveTransitionKind = "confirmar_recogida" | "anunciar_llegada";

export type ViajeMovePlan =
  | {
      kind: "move";
      target: "origen" | "destino";
      transition: MoveTransitionKind;
    }
  | {
      kind: "blocked";
      reason: string;
    };

export function resolveViajeMovePlan(fase: string): ViajeMovePlan {
  switch (fase) {
    case FASE_VIAJE.HACIA_ORIGEN:
      return {
        kind: "move",
        target: "origen",
        transition: "confirmar_recogida",
      };
    case FASE_VIAJE.HACIA_DESTINO:
      return {
        kind: "move",
        target: "destino",
        transition: "anunciar_llegada",
      };
    case FASE_VIAJE.ASIGNADO:
      return {
        kind: "blocked",
        reason:
          "Inicia el viaje desde la app del transportista antes de usar /move.",
      };
    case FASE_VIAJE.EN_DESTINO:
    case FASE_VIAJE.INSPECCION:
    case FASE_VIAJE.CODIGO_PENDIENTE:
      return {
        kind: "blocked",
        reason:
          "El tramo geográfico terminó. Usa la UI de empresa y transportista para inspección y cierre.",
      };
    case FASE_VIAJE.RESUMEN:
    case FASE_VIAJE.COMPLETADO:
      return {
        kind: "blocked",
        reason: "El viaje ya está completado. Usa /reset para repetir la prueba.",
      };
    default:
      return {
        kind: "blocked",
        reason: `Fase no soportada para /move: ${fase}`,
      };
  }
}
