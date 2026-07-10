import { getMapboxServerToken } from "@/lib/mapbox/token";

type GeocodingResponse = {
  features?: Array<{ place_name?: string }>;
};

export async function reverseGeocode(
  lng: number,
  lat: number,
): Promise<string | null> {
  const token = getMapboxServerToken();
  if (!token) return null;

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
    return data.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}
