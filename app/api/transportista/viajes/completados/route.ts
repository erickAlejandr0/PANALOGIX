import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { transportistaRepository } from "@/repositories/transportistaRepository";
import { transportistaViajesHistorialService } from "@/service/transportistaViajesHistorialService";

export async function GET(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const transportista = await transportistaRepository.getByUserId(
      auth.session.userId,
    );
    if (!transportista) {
      return Response.json(
        { error: "Perfil de transportista no encontrado" },
        { status: 404 },
      );
    }

    const page = await transportistaViajesHistorialService.getHistorialPage(
      transportista.id,
    );

    return Response.json({ data: page });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
