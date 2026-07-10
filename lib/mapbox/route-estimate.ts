import { addSecondsToIsoDate } from "@/lib/dates/panama";
import {
  getDrivingRoute,
  type DrivingRouteError,
} from "@/lib/mapbox/directions";

export type RouteEstimateInput = {
  origen: [number, number];
  destino: [number, number];
  fecha_salida?: string;
};

export type RouteEstimateResult = {
  durationSeconds: number;
  distanceMeters: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  fecha_entrega_estimada: string | null;
};

export type RouteEstimateResponse =
  | { ok: true; data: RouteEstimateResult }
  | { ok: false; error: DrivingRouteError };

export async function getRouteEstimate(
  input: RouteEstimateInput,
): Promise<RouteEstimateResponse> {
  const routeResult = await getDrivingRoute(input.origen, input.destino);
  if (!routeResult.ok) {
    return routeResult;
  }

  const route = routeResult.data;
  const fechaEntrega = input.fecha_salida
    ? addSecondsToIsoDate(input.fecha_salida, route.durationSeconds)
    : null;

  return {
    ok: true,
    data: {
      durationSeconds: route.durationSeconds,
      distanceMeters: route.distanceMeters,
      geometry: route.geometry,
      fecha_entrega_estimada: fechaEntrega,
    },
  };
}
