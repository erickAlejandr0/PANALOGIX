import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth/jwt";
import { getBearerToken } from "@/lib/auth/request-token";

export type AuthPayload = {
  userId: number;
  roleId: number;
  email: string;
  onboardingCompleted: boolean;
};

export async function getAuthFromRequest(
  request?: Request,
): Promise<AuthPayload | null> {
  if (request) {
    const bearer = getBearerToken(request);
    if (bearer) {
      return verifyJwtToken(bearer);
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyJwtToken(token);
}
