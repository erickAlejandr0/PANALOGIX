import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { transportistaHomeService } from "@/service/transportistaHomeService";

export async function PATCH(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const body = (await request.json()) as { disponible?: unknown };
    if (typeof body.disponible !== "boolean") {
      return Response.json(
        { error: "El campo disponible es requerido" },
        { status: 400 },
      );
    }

    const result = await transportistaHomeService.updateDisponible(
      auth.session.userId,
      body.disponible,
    );

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 404 });
    }

    return Response.json({ data: result.data });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
