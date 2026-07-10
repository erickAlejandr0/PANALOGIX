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

    const result = await billingService.createEmpresaSetupIntent(
      empresa,
      auth.session.email,
    );

    if (!result.success) {
      return Response.json(
        {
          error: result.error,
          ...(result.code ? { code: result.code } : {}),
        },
        { status: 400 },
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
