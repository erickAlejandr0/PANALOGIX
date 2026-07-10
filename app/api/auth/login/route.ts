import { authService } from "@/service/authService";
import { buildAuthApiResponse } from "@/lib/auth/api-response";
import { validateLoginInput } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const sanitizedEmail = email.trim();
    const sanitizedPassword = password.trim();

    const validationError = validateLoginInput(
      sanitizedEmail,
      sanitizedPassword,
    );
    if (validationError) {
      return Response.json(validationError, { status: 400 });
    }

    const result = await authService.login(sanitizedEmail, sanitizedPassword);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 401 });
    }

    return Response.json(buildAuthApiResponse(result));
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
