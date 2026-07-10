import { requireEmpresaSession } from "@/lib/auth/require-empresa-session";
import { billingService } from "@/service/billingService";
import { empresaRepository } from "@/repositories/empresaRepository";
import { getStripeClient } from "@/lib/stripe/client";

export async function POST(request: Request) {
  try {
    const auth = await requireEmpresaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const setupIntentId = (body as { setupIntentId?: unknown }).setupIntentId;
    if (typeof setupIntentId !== "string" || !setupIntentId.trim()) {
      return Response.json(
        { error: "setupIntentId es requerido" },
        { status: 400 },
      );
    }

    const empresa = await empresaRepository.getByUserId(auth.session.userId);
    if (!empresa) {
      return Response.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return Response.json(
        { error: "Stripe no está configurado" },
        { status: 503 },
      );
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    if (setupIntent.status !== "succeeded") {
      return Response.json(
        { error: "La configuración de pago no se completó" },
        { status: 400 },
      );
    }

    await billingService.handleSetupIntentSucceeded(setupIntentId);

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
