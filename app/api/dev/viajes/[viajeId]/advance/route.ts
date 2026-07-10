import { gateDevRequest } from "@/lib/dev/guard";
import { FASE_VIAJE, type FaseViaje } from "@/lib/fletes/constants";
import { devViajeSimulationService } from "@/service/devViajeSimulationService";

type RouteContext = {
  params: Promise<{ viajeId: string }>;
};

const VALID_TARGET_PHASES = new Set<string>([
  FASE_VIAJE.HACIA_ORIGEN,
  FASE_VIAJE.HACIA_DESTINO,
  FASE_VIAJE.EN_DESTINO,
  FASE_VIAJE.INSPECCION,
  FASE_VIAJE.CODIGO_PENDIENTE,
  FASE_VIAJE.RESUMEN,
]);

type AdvanceBody = {
  to?: string;
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

    let targetFase: FaseViaje | undefined;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as AdvanceBody;
      if (body.to) {
        if (!VALID_TARGET_PHASES.has(body.to)) {
          return Response.json(
            {
              error: `Fase destino inválida. Valores permitidos: ${[...VALID_TARGET_PHASES].join(", ")}`,
            },
            { status: 400 },
          );
        }
        targetFase = body.to as FaseViaje;
      }
    }

    const result = await devViajeSimulationService.advance(viajeId, targetFase);
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
