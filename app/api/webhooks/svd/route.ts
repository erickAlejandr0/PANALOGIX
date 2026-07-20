import { getSvdWebhookSecret } from "@/lib/svd/config";
import type { SvdWebhookPayload } from "@/lib/svd/types";
import { verifySvdWebhookSignature } from "@/lib/svd/webhook-hmac";
import { documentVerificationService } from "@/service/documentVerificationService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = getSvdWebhookSecret();
  if (!webhookSecret) {
    return Response.json(
      { error: "Webhook SVD no configurado" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-svd-signature");
  const body = await request.text();

  if (!verifySvdWebhookSignature(body, signature, webhookSecret)) {
    return Response.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: SvdWebhookPayload;
  try {
    payload = JSON.parse(body) as SvdWebhookPayload;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (
    !payload.transportista_id ||
    !payload.tipo_documento ||
    !payload.resultado
  ) {
    return Response.json({ error: "Payload incompleto" }, { status: 400 });
  }

  try {
    await documentVerificationService.applyWebhookPayload(payload);
  } catch (err) {
    console.error("[svd] webhook process error", err);
    return Response.json({ error: "Error procesando webhook" }, { status: 500 });
  }

  return Response.json({ received: true });
}
