import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { TRANSPORTISTA_ROLE_ID } from "@/lib/validations/onboarding";
import { billingService } from "@/service/billingService";
import { empresaRepository } from "@/repositories/empresaRepository";
import { transportistaRepository } from "@/repositories/transportistaRepository";

export async function GET(request: Request) {
  try {
    const session = await getAuthFromRequest(request);
    if (!session) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.roleId === EMPRESA_ROLE_ID) {
      const empresa = await empresaRepository.getByUserId(session.userId);
      if (!empresa) {
        return Response.json({ error: "Empresa no encontrada" }, { status: 404 });
      }
      const data = await billingService.getEmpresaStatus(empresa);
      return Response.json({ data });
    }

    if (session.roleId === TRANSPORTISTA_ROLE_ID) {
      const transportista = await transportistaRepository.getByUserId(
        session.userId,
      );
      if (!transportista) {
        return Response.json(
          { error: "Transportista no encontrado" },
          { status: 404 },
        );
      }
      const data =
        await billingService.refreshTransportistaStatus(transportista);
      return Response.json({ data });
    }

    return Response.json({ error: "Rol no soportado" }, { status: 403 });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
