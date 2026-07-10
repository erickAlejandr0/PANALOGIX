import { parseCoordinate } from "@/lib/api/parse-coordinates";
import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { transportistaHomeService } from "@/service/transportistaHomeService";

function parseBodyCoordinate(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return { error: `${label} inválida` };
  }
  return { value: number };
}

export async function POST(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const origenLng = parseBodyCoordinate(body.origen_lng, "Longitud de origen");
    if ("error" in origenLng) {
      return Response.json({ error: origenLng.error }, { status: 400 });
    }
    const origenLat = parseBodyCoordinate(body.origen_lat, "Latitud de origen");
    if ("error" in origenLat) {
      return Response.json({ error: origenLat.error }, { status: 400 });
    }
    const destinoLng = parseBodyCoordinate(body.destino_lng, "Longitud de destino");
    if ("error" in destinoLng) {
      return Response.json({ error: destinoLng.error }, { status: 400 });
    }
    const destinoLat = parseBodyCoordinate(body.destino_lat, "Latitud de destino");
    if ("error" in destinoLat) {
      return Response.json({ error: destinoLat.error }, { status: 400 });
    }

    const result = await transportistaHomeService.getRoute(
      { lng: origenLng.value, lat: origenLat.value },
      { lng: destinoLng.value, lat: destinoLat.value },
    );

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 422 });
    }

    return Response.json({ data: result.data });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
