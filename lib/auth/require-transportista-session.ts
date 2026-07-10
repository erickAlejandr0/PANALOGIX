import {
  getAuthFromRequest,
  type AuthPayload,
} from "@/lib/auth/get-authenticated-user";
import { TRANSPORTISTA_ROLE_ID } from "@/lib/validations/onboarding";

type RequireTransportistaSuccess = { session: AuthPayload };
type RequireTransportistaFailure = { response: Response };

export async function requireTransportistaSession(
  request: Request,
): Promise<RequireTransportistaSuccess | RequireTransportistaFailure> {
  const session = await getAuthFromRequest(request);

  if (!session) {
    return {
      response: Response.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  if (session.roleId !== TRANSPORTISTA_ROLE_ID) {
    return {
      response: Response.json(
        { error: "Esta API es solo para transportistas" },
        { status: 403 },
      ),
    };
  }

  return { session };
}
