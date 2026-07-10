export function getMapboxServerToken() {
  return (
    process.env.MAPBOX_API_KEY ??
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    null
  );
}

export function getMapboxClientToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null;
}
