import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { reverseGeocode } from "@/lib/mapbox/geocoding";

export async function GET(request: Request) {
  const session = await getAuthFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (session.roleId !== EMPRESA_ROLE_ID) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const lng = Number(searchParams.get("lng"));
  const lat = Number(searchParams.get("lat"));

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const placeName = await reverseGeocode(lng, lat);
  if (!placeName) {
    return NextResponse.json(
      { error: "No se pudo obtener la dirección" },
      { status: 502 },
    );
  }

  return NextResponse.json({ place_name: placeName });
}
