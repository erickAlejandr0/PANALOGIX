import { getPointCoordinates } from "@/lib/mapbox/geometry";
import { getMapboxServerToken } from "@/lib/mapbox/token";

type DirectionsResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    duration?: number;
    distance?: number;
    geometry?: {
      type: "LineString";
      coordinates: [number, number][];
    };
    legs?: Array<{
      steps?: Array<{
        name?: string;
        distance?: number;
        duration?: number;
        maneuver?: {
          instruction?: string;
        };
      }>;
    }>;
  }>;
};

export type RouteStep = {
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  instruction: string;
};

export type DrivingRouteResult = {
  durationSeconds: number;
  distanceMeters: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  steps: RouteStep[];
};

export type DrivingRouteErrorCode = "NO_ROUTE" | "UNAVAILABLE";

export type DrivingRouteError = {
  code: DrivingRouteErrorCode;
  message: string;
};

export type DrivingRouteResponse =
  | { ok: true; data: DrivingRouteResult }
  | { ok: false; error: DrivingRouteError };

export type DrivingRouteOptions = {
  useTraffic?: boolean;
  includeSteps?: boolean;
};

export async function getDrivingRoute(
  origin: [number, number],
  destination: [number, number],
  options: DrivingRouteOptions = {},
): Promise<DrivingRouteResponse> {
  const token = getMapboxServerToken();
  if (!token) {
    return {
      ok: false,
      error: {
        code: "UNAVAILABLE",
        message: "Token de Mapbox no configurado en el servidor.",
      },
    };
  }

  const profile = options.useTraffic ? "driving-traffic" : "driving";
  const coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}`,
  );
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", token);

  if (options.includeSteps !== false) {
    url.searchParams.set("steps", "true");
  }

  try {
    const response = await fetch(url.toString());
    const data = (await response.json()) as DirectionsResponse;

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "UNAVAILABLE",
          message: data.message ?? "Mapbox no pudo calcular la ruta.",
        },
      };
    }

    if (data.code === "NoRoute" || !data.routes?.length) {
      return {
        ok: false,
        error: {
          code: "NO_ROUTE",
          message:
            "No hay ruta terrestre entre origen y destino. Seleccione puntos alcanzables por carretera dentro de Panamá.",
        },
      };
    }

    const route = data.routes[0];
    if (
      !route.geometry ||
      typeof route.duration !== "number" ||
      typeof route.distance !== "number"
    ) {
      return {
        ok: false,
        error: {
          code: "UNAVAILABLE",
          message: "La respuesta de Mapbox no incluyó una ruta válida.",
        },
      };
    }

    const steps: RouteStep[] =
      route.legs?.[0]?.steps?.map((step) => ({
        name: step.name?.trim() || "Continúe",
        distanceMeters: step.distance ?? 0,
        durationSeconds: step.duration ?? 0,
        instruction: step.maneuver?.instruction?.trim() || "Continúe",
      })) ?? [];

    return {
      ok: true,
      data: {
        durationSeconds: route.duration,
        distanceMeters: route.distance,
        geometry: route.geometry,
        steps,
      },
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "UNAVAILABLE",
        message: "Error al consultar la API de direcciones de Mapbox.",
      },
    };
  }
}

export { addSecondsToIsoDate } from "@/lib/dates/panama";
