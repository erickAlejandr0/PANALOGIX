import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/auth/app-url";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE,
} from "@/lib/auth/constants";
import { buildGoogleAuthUrl, verifyGoogleIdToken } from "@/lib/auth/google";
import {
  createOAuthState,
  createOAuthStatePayload,
} from "@/lib/auth/oauth-state";
import { authService } from "@/service/authService";
import { buildAuthApiResponse } from "@/lib/auth/api-response";
import {
  parseAuthMode,
  parseRoleId,
  validateGoogleMobileInput,
  validateGoogleWebStartParams,
} from "@/lib/validations/auth";

function oauthErrorRedirect(request: Request, code: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${code}`, getAppBaseUrl(request.url)),
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = parseAuthMode(searchParams.get("mode"));
    const roleId = parseRoleId(searchParams.get("roleId"));

    const validationError = validateGoogleWebStartParams(mode, roleId);
    if (validationError) {
      const redirectPath =
        mode === "register"
          ? "/Sign-up?error=invalid_params"
          : "/login?error=invalid_params";
      return NextResponse.redirect(
        new URL(redirectPath, getAppBaseUrl(request.url)),
      );
    }

    const statePayload = createOAuthStatePayload(mode!, roleId ?? undefined);
    const state = createOAuthState(statePayload);
    const authUrl = buildGoogleAuthUrl(state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE,
      sameSite: "lax",
    });

    return response;
  } catch {
    return oauthErrorRedirect(request, "oauth_failed");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateGoogleMobileInput(body);

    if ("error" in validation) {
      return Response.json(validation, { status: 400 });
    }

    const { idToken, mode, roleId } = validation.data;
    const profile = await verifyGoogleIdToken(idToken);

    if (!profile) {
      return Response.json({ error: "Token de Google inválido" }, { status: 401 });
    }

    const result = await authService.loginWithGoogle({
      googleId: profile.googleId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      mode,
      roleId,
      picture: profile.picture,
    });

    if (!result.success) {
      const status = result.error.includes("Regístrate") ? 401 : 409;
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
