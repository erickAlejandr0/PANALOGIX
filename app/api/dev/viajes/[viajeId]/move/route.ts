import { gateDevRequest } from "@/lib/dev/guard";
import { devViajeMoveService } from "@/service/devViajeMoveService";

type RouteContext = {
  params: Promise<{ viajeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const gate = gateDevRequest(request);
  if (gate) return gate;

  try {
    const { viajeId: viajeIdParam } = await context.params;
    const viajeId = Number.parseInt(viajeIdParam, 10);
    if (Number.isNaN(viajeId)) {
      return Response.json({ error: "ID de viaje inválido" }, { status: 400 });
    }

    const result = await devViajeMoveService.move(viajeId);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 422 });
    }

    return Response.json({ data: result.data });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
