import { parseRouteId } from "@/lib/api/parse-route-id";
import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { onboardingService } from "@/service/onboardingService";

type RouteContext = {
  params: Promise<{ configId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const { configId } = await context.params;
    const parsedId = parseRouteId(configId);
    if (parsedId === null) {
      return Response.json(
        { error: "Configuración de vehículo inválida" },
        { status: 400 },
      );
    }

    const detalle = await onboardingService.getConfigDetalle(parsedId);
    if (!detalle) {
      return Response.json(
        { error: "Configuración no encontrada" },
        { status: 404 },
      );
    }

    return Response.json({ detalle });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
