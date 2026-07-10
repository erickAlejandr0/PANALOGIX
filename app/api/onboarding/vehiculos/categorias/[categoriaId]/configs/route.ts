import { parseRouteId } from "@/lib/api/parse-route-id";
import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { onboardingService } from "@/service/onboardingService";

type RouteContext = {
  params: Promise<{ categoriaId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const { categoriaId } = await context.params;
    const parsedId = parseRouteId(categoriaId);
    if (parsedId === null) {
      return Response.json(
        { error: "Categoría de vehículo inválida" },
        { status: 400 },
      );
    }

    const configs = await onboardingService.getConfigsByCategoria(parsedId);
    return Response.json({ data: configs });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
