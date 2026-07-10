import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { postulacionService } from "@/service/postulacionService";

export async function GET(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const publicacionIdRaw = searchParams.get("publicacionId");
    const publicacionId = Number(publicacionIdRaw);

    if (!Number.isFinite(publicacionId)) {
      return Response.json(
        { error: "publicacionId es requerido" },
        { status: 400 },
      );
    }

    const result = await postulacionService.getApplicationStatus(
      auth.session.userId,
      publicacionId,
    );

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

export async function POST(request: Request) {
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
    const publicacionId = Number(payload.publicacionId);
    const flotaId =
      payload.flotaId !== undefined && payload.flotaId !== null
        ? Number(payload.flotaId)
        : undefined;

    if (!Number.isFinite(publicacionId)) {
      return Response.json(
        { error: "publicacionId es requerido" },
        { status: 400 },
      );
    }

    if (flotaId !== undefined && !Number.isFinite(flotaId)) {
      return Response.json({ error: "flotaId inválido" }, { status: 400 });
    }

    const result = await postulacionService.applyForUser(
      auth.session.userId,
      publicacionId,
      flotaId,
    );

    if (!result.success) {
      return Response.json(
        {
          error: result.error,
          ...(result.code ? { code: result.code } : {}),
          ...(result.redirectTo ? { redirectTo: result.redirectTo } : {}),
        },
        { status: 400 },
      );
    }

    return Response.json({ data: result.data }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
