import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import {
  DocumentVerificationServiceError,
  documentVerificationService,
} from "@/service/documentVerificationService";

export async function GET(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const data = await documentVerificationService.getStatus(
      auth.session.userId,
    );
    return Response.json({ data });
  } catch (err) {
    if (err instanceof DocumentVerificationServiceError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    console.error("[svd] GET estado", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
