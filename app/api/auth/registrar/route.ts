import { validateRegisterInput, parseRoleId } from "@/lib/validations/auth";
import { buildAuthApiResponse } from "@/lib/auth/api-response";
import { authService } from "@/service/authService";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const roleId = parseRoleId(body.roleId);
    if (roleId === null) {
      return Response.json({ error: "Rol inválido" }, { status: 400 });
    }

    const sanitizedBody = {
      roleId,
      email: body.email.trim(),
      password: body.password.trim(),
    };

    const validationError = validateRegisterInput(
      sanitizedBody.email,
      sanitizedBody.password,
      sanitizedBody.roleId,
    );
    if (validationError) {
      return Response.json(validationError, { status: 400 });
    }

    const result = await authService.register(sanitizedBody);

    if (!result.success) {
      const status = result.error.includes("Google") ? 409 : 401;
      return Response.json({ error: result.error }, { status });
    }

    return Response.json(buildAuthApiResponse(result));
  } catch {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
