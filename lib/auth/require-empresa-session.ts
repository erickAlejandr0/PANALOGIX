import {
  getAuthFromRequest,
  type AuthPayload,
} from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";

type RequireEmpresaSuccess = { session: AuthPayload };
type RequireEmpresaFailure = { response: Response };

export async function requireEmpresaSession(
  request: Request,
): Promise<RequireEmpresaSuccess | RequireEmpresaFailure> {
  const session = await getAuthFromRequest(request);

  if (!session) {
    return {
      response: Response.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  if (session.roleId !== EMPRESA_ROLE_ID) {
    return {
      response: Response.json(
        { error: "Esta API es solo para empresas" },
        { status: 403 },
      ),
    };
  }

  return { session };
}
