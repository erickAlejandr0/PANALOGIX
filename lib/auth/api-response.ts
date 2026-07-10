import { getPostAuthRedirect } from "@/lib/auth/routes";
import type { PublicUser } from "@/lib/auth/user";

export function buildAuthApiResponse(result: {
  token: string;
  user: PublicUser;
  linked?: boolean;
}) {
  return {
    success: true as const,
    token: result.token,
    user: result.user,
    onboardingCompleted: result.user.onboardingCompleted,
    redirectTo: getPostAuthRedirect(result.user),
    ...(result.linked !== undefined ? { linked: result.linked } : {}),
  };
}
