import { requireTransportistaSession } from "@/lib/auth/require-transportista-session";
import {
  DocumentVerificationServiceError,
  documentVerificationService,
} from "@/service/documentVerificationService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireTransportistaSession(request);
    if ("response" in auth) {
      return auth.response;
    }

    const form = await request.formData();
    const tipo = String(form.get("tipo_documento") ?? "").trim();
    const fileEntry = form.get("file");

    if (!tipo) {
      return Response.json(
        { error: "tipo_documento es obligatorio" },
        { status: 400 },
      );
    }

    if (!(fileEntry instanceof File)) {
      return Response.json(
        { error: "file es obligatorio" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const result = await documentVerificationService.submitDocument(
      auth.session.userId,
      tipo,
      buffer,
      fileEntry.name || "documento",
      fileEntry.type || null,
    );

    return Response.json({ data: result }, { status: 202 });
  } catch (err) {
    if (err instanceof DocumentVerificationServiceError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    console.error("[svd] POST enviar", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
