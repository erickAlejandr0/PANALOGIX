import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID, TRANSPORTISTA_ROLE_ID } from "@/lib/fletes/constants";
import { empresaRepository } from "@/repositories/empresaRepository";
import { transportistaRepository } from "@/repositories/transportistaRepository";
import { viajeService } from "@/service/viajeService";

export async function GET(request: Request) {
  try {
    const session = await getAuthFromRequest(request);
    if (!session) {
      return Response.json({ error: "Token no proporcionado" }, { status: 401 });
    }

    if (session.roleId === TRANSPORTISTA_ROLE_ID) {
      const transportista = await transportistaRepository.getByUserId(
        session.userId,
      );
      if (!transportista) {
        return Response.json(
          { error: "Perfil de transportista no encontrado" },
          { status: 404 },
        );
      }

      const result = await viajeService.listByTransportista(transportista.id);
      if (!result.success) {
        return Response.json({ error: result.error }, { status: 400 });
      }

      return Response.json({ viajes: result.data });
    }

    if (session.roleId === EMPRESA_ROLE_ID) {
      const empresa = await empresaRepository.getByUserId(session.userId);
      if (!empresa) {
        return Response.json(
          { error: "Perfil de empresa no encontrado" },
          { status: 404 },
        );
      }

      const result = await viajeService.listByEmpresa(empresa.id);
      if (!result.success) {
        return Response.json({ error: result.error }, { status: 400 });
      }

      return Response.json({ viajes: result.data });
    }

    return Response.json({ error: "Rol no autorizado" }, { status: 403 });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
