import { parseCoordinate } from "@/lib/api/parse-coordinates";
import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { transportistaHomeService } from "@/service/transportistaHomeService";

export async function GET(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const lng = parseCoordinate(searchParams.get("lng"), "Longitud");
    if ("error" in lng) {
      return Response.json({ error: lng.error }, { status: 400 });
    }

    const lat = parseCoordinate(searchParams.get("lat"), "Latitud");
    if ("error" in lat) {
      return Response.json({ error: lat.error }, { status: 400 });
    }

    const bearingRaw = searchParams.get("bearing");
    const bearing =
      bearingRaw === null || bearingRaw.trim() === ""
        ? undefined
        : Number(bearingRaw);

    if (bearing !== undefined && !Number.isFinite(bearing)) {
      return Response.json({ error: "Rumbo inválido" }, { status: 400 });
    }

    const result = await transportistaHomeService.getSpeedLimit(
      lng.value,
      lat.value,
      bearing,
    );

    return Response.json({ data: result.data });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
