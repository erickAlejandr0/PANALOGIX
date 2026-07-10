import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { transportistaRepository } from "@/repositories/transportistaRepository";
import { viajeService } from "@/service/viajeService";

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

    const result = await viajeService.getActiveForTransportista(transportista.id);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ data: result.data.viaje });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
