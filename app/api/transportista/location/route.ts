import { parseCoordinate } from "@/lib/api/parse-coordinates";
import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { transportistaLocationService } from "@/service/transportistaLocationService";

export async function PATCH(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const lng = parseCoordinate(
      payload.lng !== undefined ? String(payload.lng) : null,
      "Longitud",
    );
    if ("error" in lng) {
      return Response.json({ error: lng.error }, { status: 400 });
    }

    const lat = parseCoordinate(
      payload.lat !== undefined ? String(payload.lat) : null,
      "Latitud",
    );
    if ("error" in lat) {
      return Response.json({ error: lat.error }, { status: 400 });
    }

    const heading =
      payload.bearing !== undefined && payload.bearing !== null
        ? Number(payload.bearing)
        : null;
    const speedKmh =
      payload.speedKmh !== undefined && payload.speedKmh !== null
        ? Number(payload.speedKmh)
        : null;

    if (heading !== null && !Number.isFinite(heading)) {
      return Response.json({ error: "Rumbo inválido" }, { status: 400 });
    }

    if (speedKmh !== null && !Number.isFinite(speedKmh)) {
      return Response.json({ error: "Velocidad inválida" }, { status: 400 });
    }

    const result = await transportistaLocationService.updateLocation({
      userId: auth.session.userId,
      lng: lng.value,
      lat: lat.value,
      heading,
      speedKmh,
    });

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ data: result.data });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
