import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { transportistaHomeService } from "@/service/transportistaHomeService";

export async function GET(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const profile = await transportistaHomeService.getProfile(auth.session.userId);
    if (!profile) {
      return Response.json(
        { error: "Perfil de transportista no encontrado" },
        { status: 404 },
      );
    }

    return Response.json({ data: profile });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
