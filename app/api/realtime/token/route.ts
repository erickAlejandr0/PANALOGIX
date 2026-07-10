import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { TRANSPORTISTA_ROLE_ID } from "@/lib/validations/onboarding";
import { createAblyTokenRequest } from "@/lib/events/publisher";
import { dashboardRepository } from "@/repositories/dashboardRepository";
import { empresaRepository } from "@/repositories/empresaRepository";
import { transportistaRepository } from "@/repositories/transportistaRepository";
import { realtimeBroadcastService } from "@/service/realtimeBroadcastService";

export async function GET(request: Request) {
  try {
    const session = await getAuthFromRequest(request);
    if (!session) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!process.env.ABLY_API_KEY) {
      return Response.json(
        { error: "Realtime no configurado" },
        { status: 503 },
      );
    }

    let capability: string;

    if (session.roleId === EMPRESA_ROLE_ID) {
      const empresa = await empresaRepository.getByUserId(session.userId);
      if (!empresa) {
        return Response.json({ error: "Empresa no encontrada" }, { status: 404 });
      }

      const activeViajeIds = await dashboardRepository.getActiveViajeIds(
        empresa.id,
      );

      capability = realtimeBroadcastService.buildEmpresaTokenCapability(
        empresa.id,
        activeViajeIds,
      );
    } else if (session.roleId === TRANSPORTISTA_ROLE_ID) {
      const transportista = await transportistaRepository.getByUserId(
        session.userId,
      );
      if (!transportista) {
        return Response.json(
          { error: "Transportista no encontrado" },
          { status: 404 },
        );
      }

      capability = realtimeBroadcastService.buildTransportistaTokenCapability(
        transportista.id,
      );
    } else {
      return Response.json({ error: "Rol no soportado" }, { status: 403 });
    }

    const tokenRequest = await createAblyTokenRequest({
      clientId: `user:${session.userId}`,
      capability,
    });

    return Response.json({ tokenRequest });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
