import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { TRANSPORTISTA_ROLE_ID } from "@/lib/validations/onboarding";
import {
  breakdownToDto,
  buildPaymentBreakdown,
} from "@/lib/stripe/fees";

export async function GET(request: Request) {
  try {
    const session = await getAuthFromRequest(request);
    if (!session) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    if (
      session.roleId !== EMPRESA_ROLE_ID &&
      session.roleId !== TRANSPORTISTA_ROLE_ID
    ) {
      return Response.json({ error: "Rol no soportado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("totalPago");
    const totalPago = raw ? Number.parseFloat(raw) : Number.NaN;

    if (!Number.isFinite(totalPago) || totalPago <= 0) {
      return Response.json(
        { error: "totalPago inválido" },
        { status: 400 },
      );
    }

    const breakdown = buildPaymentBreakdown(totalPago);
    if (!breakdown) {
      return Response.json(
        { error: "No se pudo calcular el desglose" },
        { status: 400 },
      );
    }

    return Response.json({ data: breakdownToDto(breakdown) });
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
