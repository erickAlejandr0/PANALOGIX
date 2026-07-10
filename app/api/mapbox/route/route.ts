import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { getRouteEstimate } from "@/lib/mapbox/route-estimate";

function parseCoordinate(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return { error: `${label} inválida` };
  }
  return { value: number };
}

export async function POST(request: Request) {
  const session = await getAuthFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (session.roleId !== EMPRESA_ROLE_ID) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const origenLng = parseCoordinate(body.origen_lng, "Longitud de origen");
  if ("error" in origenLng) {
    return NextResponse.json({ error: origenLng.error }, { status: 400 });
  }
  const origenLat = parseCoordinate(body.origen_lat, "Latitud de origen");
  if ("error" in origenLat) {
    return NextResponse.json({ error: origenLat.error }, { status: 400 });
  }
  const destinoLng = parseCoordinate(body.destino_lng, "Longitud de destino");
  if ("error" in destinoLng) {
    return NextResponse.json({ error: destinoLng.error }, { status: 400 });
  }
  const destinoLat = parseCoordinate(body.destino_lat, "Latitud de destino");
  if ("error" in destinoLat) {
    return NextResponse.json({ error: destinoLat.error }, { status: 400 });
  }

  const fechaSalida =
    typeof body.fecha_salida === "string" ? body.fecha_salida.trim() : undefined;

  const result = await getRouteEstimate({
    origen: [origenLng.value, origenLat.value],
    destino: [destinoLng.value, destinoLat.value],
    fecha_salida: fechaSalida || undefined,
  });

  if (!result.ok) {
    const status = result.error.code === "NO_ROUTE" ? 422 : 503;
    return NextResponse.json(
      { error: result.error.message, code: result.error.code },
      { status },
    );
  }

  return NextResponse.json(result.data);
}
