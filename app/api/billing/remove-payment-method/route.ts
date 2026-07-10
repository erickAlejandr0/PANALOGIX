import { requireEmpresaSession } from "@/lib/auth/require-empresa-session";
import { billingService } from "@/service/billingService";
import { empresaRepository } from "@/repositories/empresaRepository";

export async function POST(request: Request) {
  try {
    const auth = await requireEmpresaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const empresa = await empresaRepository.getByUserId(auth.session.userId);
    if (!empresa) {
      return Response.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const result = await billingService.removeEmpresaPaymentMethod(empresa);
    if (!result.success) {
      return Response.json(
        {
          error: result.error,
          ...(result.code ? { code: result.code } : {}),
        },
        { status: 400 },
      );
    }

    const updated = await empresaRepository.getByUserId(auth.session.userId);
    if (!updated) {
      return Response.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const data = await billingService.getEmpresaStatus(updated);
    return Response.json({ data });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
