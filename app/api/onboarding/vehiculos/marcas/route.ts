import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { onboardingService } from "@/service/onboardingService";

export async function GET(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const marcas = onboardingService.getMarcas();
    return Response.json({ data: marcas });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
