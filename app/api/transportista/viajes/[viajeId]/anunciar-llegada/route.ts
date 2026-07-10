import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { transportistaRepository } from "@/repositories/transportistaRepository";
import { negociacionViajeService } from "@/service/negociacionViajeService";

type RouteContext = {
  params: Promise<{ viajeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

    const { viajeId: viajeIdParam } = await context.params;
    const viajeId = Number.parseInt(viajeIdParam, 10);
    if (Number.isNaN(viajeId)) {
      return Response.json({ error: "ID de viaje inválido" }, { status: 400 });
    }

    const result = await negociacionViajeService.anunciarLlegada(
      viajeId,
      transportista.id,
    );
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 422 });
    }

    return Response.json({ data: result.data.viaje });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
