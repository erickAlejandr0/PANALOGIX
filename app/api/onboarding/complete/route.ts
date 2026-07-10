import { buildAuthApiResponse } from "@/lib/auth/api-response";
import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { TRANSPORTISTA_CONTINUE_PATH } from "@/lib/auth/routes";
import { parseTransportistaOnboardingBody } from "@/lib/validations/onboarding";
import { onboardingService } from "@/service/onboardingService";

export async function POST(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const body = await request.json();
    const validation = parseTransportistaOnboardingBody(body);

    if ("error" in validation) {
      return Response.json(validation, { status: 400 });
    }

    const idCategoria = Number(
      (body as { id_categoria?: unknown }).id_categoria,
    );
    if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
      return Response.json(
        { error: "Categoría de vehículo inválida" },
        { status: 400 },
      );
    }

    const result = await onboardingService.completeTransportistaOnboarding(
      auth.session.userId,
      {
        ...validation.data,
        id_categoria: idCategoria,
        aceptaTerminos: true,
      },
    );

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({
      ...buildAuthApiResponse(result),
      redirectTo: TRANSPORTISTA_CONTINUE_PATH,
    });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
