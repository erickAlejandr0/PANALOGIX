import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import { billingService } from "@/service/billingService";
import { transportistaRepository } from "@/repositories/transportistaRepository";

function logConnectOnboardError(error: unknown) {
  if (error && typeof error === "object" && "type" in error) {
    const stripeError = error as {
      type?: string;
      code?: string;
      message?: string;
      param?: string;
      statusCode?: number;
    };
    console.error("[billing/connect/onboard] Stripe error:", {
      type: stripeError.type,
      code: stripeError.code,
      message: stripeError.message,
      param: stripeError.param,
      statusCode: stripeError.statusCode,
    });
    return;
  }

  console.error(
    "[billing/connect/onboard]",
    error instanceof Error ? error.message : error,
    error,
  );
}

export async function POST(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const transportista = await transportistaRepository.getByUserId(
      auth.session.userId,
    );
    if (!transportista) {
      return Response.json(
        { error: "Transportista no encontrado" },
        { status: 404 },
      );
    }

    console.info("[billing/connect/onboard] starting", {
      transportistaId: transportista.id,
      userId: auth.session.userId,
      email: auth.session.email,
      existingConnectAccountId: transportista.stripeConnectAccountId ?? null,
      billingSetupStatus: transportista.billingSetupStatus,
    });

    const result = await billingService.createTransportistaOnboardingLink(
      transportista,
      auth.session.email,
    );

    if (!result.success) {
      console.warn("[billing/connect/onboard] service error:", {
        error: result.error,
        code: result.code,
      });
      return Response.json(
        {
          error: result.error,
          ...(result.code ? { code: result.code } : {}),
        },
        { status: 400 },
      );
    }

    console.info("[billing/connect/onboard] account link created", {
      transportistaId: transportista.id,
      urlLength: result.data.url.length,
    });

    return Response.json({ data: result.data });
  } catch (error) {
    logConnectOnboardError(error);

    if (error && typeof error === "object" && "type" in error) {
      const stripeError = error as { type?: string; message?: string };
      if (stripeError.type === "StripeInvalidRequestError" && stripeError.message) {
        return Response.json({ error: stripeError.message }, { status: 400 });
      }
    }

    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
