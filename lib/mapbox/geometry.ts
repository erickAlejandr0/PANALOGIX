import { formatPanamaDate } from "@/lib/dates/panama";

export type GeoJsonGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] };

export function parseGeoJson(value: unknown): GeoJsonGeometry | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return parseGeoJson(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (typeof value !== "object" || value === null) return null;

  const geometry = value as GeoJsonGeometry;
  if (!geometry.type || !geometry.coordinates) return null;
  return geometry;
}

export function getPointCoordinates(
  geometry: unknown,
): [number, number] | null {
  const parsed = parseGeoJson(geometry);
  if (!parsed) return null;

  if (parsed.type === "Point") {
    return parsed.coordinates;
  }

  if (parsed.type === "LineString" && parsed.coordinates.length > 0) {
    return parsed.coordinates[0];
  }

  return null;
}

export function formatCoordinates(coords: [number, number]): string {
  return `${coords[0]},${coords[1]}`;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "llegada estimada pronto";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days >= 1) {
    return `llegada estimada en ${days} ${days === 1 ? "día" : "días"}`;
  }

  if (hours >= 1) {
    return `llegada estimada en ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  const minutes = Math.max(1, Math.floor(seconds / 60));
  return `llegada estimada en ${minutes} min`;
}

export function formatDeliveryDate(dateValue: string | Date): string {
  if (typeof dateValue === "string") {
    return formatPanamaDate(dateValue.slice(0, 10));
  }

  const y = dateValue.getFullYear();
  const m = String(dateValue.getMonth() + 1).padStart(2, "0");
  const d = String(dateValue.getDate()).padStart(2, "0");
  return formatPanamaDate(`${y}-${m}-${d}`);
}
