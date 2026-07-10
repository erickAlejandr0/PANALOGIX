import type { InspeccionChecklistItem } from "@/lib/entregas/types";
import type { ViajeInspeccionChecklistUpdatedPayload } from "@/lib/events/types";

const VALID_ICONS = new Set<InspeccionChecklistItem["icon"]>([
  "shield",
  "user",
  "camera",
  "calendar",
]);

export function buildDefaultChecklist(): InspeccionChecklistItem[] {
  return [
    {
      id: "sellos",
      title: "Verificar sellos e integridad",
      meta: "Precinto · Puerta trasera · Lateral izquierdo",
      instruction:
        "Confirme que los sellos se encuentren intactos y no presente cortes ni manipulación.",
      critical: true,
      completed: false,
      icon: "shield",
    },
    {
      id: "transportista",
      title: "Datos del transportista",
      meta: "Placa · Cédula",
      instruction: "Verifique los datos del transportista contra su identificación.",
      critical: true,
      completed: false,
      icon: "user",
    },
    {
      id: "fotos",
      title: "Registro fotográfico",
      meta: "Mínimo 3 ángulos: frontal, lateral, interior",
      instruction:
        "Use buena iluminación. Las fotos deben mostrar etiqueta, precinto y estado del empaque.",
      critical: false,
      completed: false,
      icon: "camera",
    },
    {
      id: "fecha",
      title: "Fecha de recepción",
      meta: "Día · Mes",
      instruction:
        "Verifique que la fecha de entrega coincida con la establecida en el sistema.",
      critical: false,
      completed: false,
      icon: "calendar",
    },
  ];
}

function isChecklistItem(value: unknown): value is InspeccionChecklistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.meta === "string" &&
    typeof item.instruction === "string" &&
    typeof item.critical === "boolean" &&
    typeof item.completed === "boolean" &&
    typeof item.icon === "string" &&
    VALID_ICONS.has(item.icon as InspeccionChecklistItem["icon"])
  );
}

export function parseStoredChecklist(
  value: unknown,
): InspeccionChecklistItem[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every(isChecklistItem)) return null;
  return value;
}

export function resolveInspeccionChecklist(
  stored: unknown,
): InspeccionChecklistItem[] {
  return parseStoredChecklist(stored) ?? buildDefaultChecklist();
}

export function countCompletedChecklist(
  items: InspeccionChecklistItem[],
): number {
  return items.filter((item) => item.completed).length;
}

export function isChecklistComplete(items: InspeccionChecklistItem[]): boolean {
  if (items.length === 0) return false;
  const allCompleted = items.every((item) => item.completed);
  const criticalDone = items
    .filter((item) => item.critical)
    .every((item) => item.completed);
  return allCompleted && criticalDone;
}

export function toChecklistBroadcastPayload(
  viajeId: number,
  publicacionId: number,
  transportistaId: number,
  items: InspeccionChecklistItem[],
): ViajeInspeccionChecklistUpdatedPayload {
  return {
    viajeId,
    publicacionId,
    transportistaId,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      completed: item.completed,
      critical: item.critical,
    })),
    completedCount: countCompletedChecklist(items),
    totalCount: items.length,
    updatedAt: new Date().toISOString(),
  };
}

export function toTransportistaChecklistItems(
  items: InspeccionChecklistItem[],
): ViajeInspeccionChecklistUpdatedPayload["items"] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    completed: item.completed,
    critical: item.critical,
  }));
}
