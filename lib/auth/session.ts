import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth/jwt";
import type { JwtPayload } from "@/lib/auth/user";

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyJwtToken(token);
}
