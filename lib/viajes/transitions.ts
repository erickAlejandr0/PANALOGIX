import { FASE_VIAJE, type FaseViaje } from "@/lib/fletes/constants";

// Cada arista representa un paso del flujo step-locked. El motivo de negocio
// se documenta en el guard del service que la ejecuta.
const ALLOWED: Record<FaseViaje, FaseViaje[]> = {
  [FASE_VIAJE.ASIGNADO]: [FASE_VIAJE.HACIA_ORIGEN],
  [FASE_VIAJE.HACIA_ORIGEN]: [FASE_VIAJE.HACIA_DESTINO],
  [FASE_VIAJE.HACIA_DESTINO]: [FASE_VIAJE.EN_DESTINO],
  [FASE_VIAJE.EN_DESTINO]: [FASE_VIAJE.INSPECCION],
  [FASE_VIAJE.INSPECCION]: [FASE_VIAJE.CODIGO_PENDIENTE],
  [FASE_VIAJE.CODIGO_PENDIENTE]: [FASE_VIAJE.RESUMEN],
  [FASE_VIAJE.RESUMEN]: [FASE_VIAJE.COMPLETADO],
  [FASE_VIAJE.COMPLETADO]: [],
};

export function canTransitionFase(from: string, to: FaseViaje): boolean {
  const allowed = ALLOWED[from as FaseViaje];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function getFaseLabel(fase: string): string {
  switch (fase) {
    case FASE_VIAJE.ASIGNADO:
      return "Asignado";
    case FASE_VIAJE.HACIA_ORIGEN:
      return "En camino a recogida";
    case FASE_VIAJE.HACIA_DESTINO:
      return "En tránsito con carga";
    case FASE_VIAJE.EN_DESTINO:
      return "En punto de entrega";
    case FASE_VIAJE.INSPECCION:
      return "Inspeccion de carga";
    case FASE_VIAJE.CODIGO_PENDIENTE:
      return "Verificacion por codigo";
    case FASE_VIAJE.RESUMEN:
      return "Resumen de entrega";
    case FASE_VIAJE.COMPLETADO:
      return "Completado";
    default:
      return fase;
  }
}
