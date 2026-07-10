import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { CODIGO_VERIFICACION } from "@/lib/fletes/constants";
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

    const body: unknown = await request.json().catch(() => null);
    const codigo =
      body && typeof body === "object"
        ? String((body as Record<string, unknown>).codigo ?? "")
        : "";

    if (!/^\d+$/.test(codigo) || codigo.length !== CODIGO_VERIFICACION.LENGTH) {
      return Response.json(
        { error: "Código inválido", reason: "incorrecto" },
        { status: 400 },
      );
    }

    const result = await negociacionViajeService.verificarCodigo(
      viajeId,
      transportista.id,
      codigo,
    );

    if (!result.success) {
      // 410 para codigo expirado, 429 para bloqueo por intentos, 422 el resto.
      const status =
        result.reason === "expirado"
          ? 410
          : result.reason === "bloqueado"
            ? 429
            : 422;
      return Response.json(
        { error: result.error, reason: result.reason },
        { status },
      );
    }

    return Response.json({ data: result.data });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
