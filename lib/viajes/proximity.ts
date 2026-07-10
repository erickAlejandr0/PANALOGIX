import { PROXIMITY_ARRIVAL_RADIUS_M } from "@/lib/fletes/constants";
import { getPointCoordinates } from "@/lib/mapbox/geometry";

export { PROXIMITY_ARRIVAL_RADIUS_M };

export function haversineMeters(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pointFromGeom(geom: unknown): { lng: number; lat: number } | null {
  const coords = getPointCoordinates(geom);
  if (!coords) return null;
  return { lng: coords[0], lat: coords[1] };
}

export function distanceToGeomMeters(
  position: { lng: number; lat: number },
  geom: unknown,
): number | null {
  const point = pointFromGeom(geom);
  if (!point) return null;
  return haversineMeters(position, point);
}

export function isWithinArrivalRadius(
  position: { lng: number; lat: number },
  geom: unknown,
): boolean {
  const distance = distanceToGeomMeters(position, geom);
  if (distance === null) return false;
  return distance <= PROXIMITY_ARRIVAL_RADIUS_M;
}
