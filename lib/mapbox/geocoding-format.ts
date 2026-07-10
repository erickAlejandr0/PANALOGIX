type GeocodingFeature = {
  place_name?: string;
  center?: [number, number];
  bbox?: [number, number, number, number];
  context?: Array<{ id: string; text: string }>;
};

type GeocodingResponse = {
  features?: GeocodingFeature[];
};

export type GeocodeZone = {
  placeLabel: string;
  contextKey: string;
  bbox: [number, number, number, number];
};

export function formatPlaceLabel(feature: GeocodingFeature): string | null {
  const context = feature.context ?? [];
  const place = context.find((item) => item.id.startsWith("place."))?.text;
  const region = context.find((item) => item.id.startsWith("region."))?.text;

  if (place && region) {
    return `${region}, ${place}`;
  }

  if (feature.place_name) {
    const parts = feature.place_name.split(",").map((part) => part.trim());
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[0]}`;
    }
    return feature.place_name;
  }

  return null;
}

export function buildContextKey(feature: GeocodingFeature): string {
  return (feature.context ?? [])
    .map((item) => item.id)
    .sort()
    .join("|");
}

function defaultBbox(lng: number, lat: number): [number, number, number, number] {
  const delta = 0.008;
  return [lng - delta, lat - delta, lng + delta, lat + delta];
}

export function extractGeocodeZone(
  feature: GeocodingFeature,
  lng: number,
  lat: number,
): GeocodeZone | null {
  const placeLabel = formatPlaceLabel(feature);
  if (!placeLabel) return null;

  const bbox =
    feature.bbox && feature.bbox.length === 4
      ? feature.bbox
      : feature.center
        ? defaultBbox(feature.center[0], feature.center[1])
        : defaultBbox(lng, lat);

  return {
    placeLabel,
    contextKey: buildContextKey(feature),
    bbox,
  };
}

export async function reverseGeocodeFeature(
  lng: number,
  lat: number,
  token: string,
): Promise<GeocodingFeature | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "es");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as GeocodingResponse;
    return data.features?.[0] ?? null;
  } catch {
    return null;
  }
}
