import { formatCoordinates } from "@/lib/mapbox/geometry";
import { getMapboxServerToken } from "@/lib/mapbox/token";

type MatrixResponse = {
  durations?: (number | null)[][];
};

export async function getDrivingDurationSeconds(
  origin: [number, number],
  destination: [number, number],
): Promise<number | null> {
  const token = getMapboxServerToken();
  if (!token) return null;

  const coordinates = `${formatCoordinates(origin)};${formatCoordinates(destination)}`;
  const url = new URL(
    `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}`,
  );
  url.searchParams.set("annotations", "duration");
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as MatrixResponse;
    const duration = data.durations?.[0]?.[1];
    return typeof duration === "number" ? duration : null;
  } catch {
    return null;
  }
}
