import { jwtVerify } from "jose";
import type { JwtPayload } from "@/lib/auth/user";

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET variable de entorno no definida");
  }
  return new TextEncoder().encode(secret);
}

export async function verifyJwtToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const { userId, email, roleId, onboardingCompleted } = payload;

    if (
      typeof userId !== "number" ||
      typeof email !== "string" ||
      typeof roleId !== "number"
    ) {
      return null;
    }

    return {
      userId,
      email,
      roleId,
      onboardingCompleted:
        typeof onboardingCompleted === "boolean" ? onboardingCompleted : false,
    };
  } catch {
    return null;
  }
}
