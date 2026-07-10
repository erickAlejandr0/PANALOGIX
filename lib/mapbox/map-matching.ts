import { formatCoordinates } from "@/lib/mapbox/geometry";
import { getMapboxServerToken } from "@/lib/mapbox/token";

type MapMatchingResponse = {
  tracepoints?: Array<{
    matchings_index?: number;
    waypoint_index?: number;
    location?: [number, number];
  } | null>;
  matchings?: Array<{
    legs?: Array<{
      annotation?: {
        maxspeed?: Array<{ speed?: number; unit?: string } | null>;
      };
    }>;
  }>;
};

export type SpeedLimitMatch = {
  speedLimitKmh: number | null;
  segmentKey: string;
  hasSpeedLimitData: boolean;
};

function parseSpeedKmh(
  entry: { speed?: number; unit?: string } | null | undefined,
) {
  if (!entry?.speed) return null;
  if (entry.unit === "mph") {
    return Math.round(entry.speed * 1.60934);
  }
  return Math.round(entry.speed);
}

function buildSegmentKey(
  data: MapMatchingResponse,
  speedLimitKmh: number | null,
): string {
  const tracepoint = data.tracepoints?.[0];
  const matchingIndex = tracepoint?.matchings_index ?? 0;
  const maxspeeds =
    data.matchings?.[matchingIndex]?.legs?.[0]?.annotation?.maxspeed ?? [];

  const signature = maxspeeds
    .slice(0, 12)
    .map((entry) => {
      if (!entry?.speed) return "x";
      return `${entry.speed}${entry.unit ?? "kmh"}`;
    })
    .join(",");

  const snapped = tracepoint?.location;
  const snappedKey = snapped
    ? `${snapped[0].toFixed(4)},${snapped[1].toFixed(4)}`
    : "none";

  return `${speedLimitKmh ?? "na"}|m${matchingIndex}|${signature}|${snappedKey}`;
}

export async function getSpeedLimitMatch(
  lng: number,
  lat: number,
  bearing?: number,
): Promise<SpeedLimitMatch | null> {
  const token = getMapboxServerToken();
  if (!token) return null;

  const coordinates = formatCoordinates([lng, lat]);
  const url = new URL(
    `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("annotations", "maxspeed");
  url.searchParams.set("radiuses", "25");
  url.searchParams.set("geometries", "geojson");

  if (bearing !== undefined && Number.isFinite(bearing) && bearing >= 0) {
    url.searchParams.set("bearings", `${Math.round(bearing)},45`);
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as MapMatchingResponse;
    const matchingIndex = data.tracepoints?.[0]?.matchings_index ?? 0;
    const maxspeeds =
      data.matchings?.[matchingIndex]?.legs?.[0]?.annotation?.maxspeed ?? [];

    let speedLimitKmh: number | null = null;
    for (const entry of maxspeeds) {
      const parsed = parseSpeedKmh(entry);
      if (parsed !== null) {
        speedLimitKmh = parsed;
        break;
      }
    }

    return {
      speedLimitKmh,
      segmentKey: buildSegmentKey(data, speedLimitKmh),
      hasSpeedLimitData: speedLimitKmh !== null,
    };
  } catch {
    return null;
  }
}

/** @deprecated Use getSpeedLimitMatch */
export async function getSpeedLimitKmh(
  lng: number,
  lat: number,
  bearing?: number,
): Promise<number | null> {
  const result = await getSpeedLimitMatch(lng, lat, bearing);
  return result?.speedLimitKmh ?? null;
}
