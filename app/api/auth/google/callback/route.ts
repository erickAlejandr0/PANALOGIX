import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthCookieOptions } from "@/lib/auth/cookies";
import { OAUTH_STATE_COOKIE } from "@/lib/auth/constants";
import { exchangeCodeForProfile } from "@/lib/auth/google";
import { getPostAuthRedirect } from "@/lib/auth/routes";
import { parseOAuthState } from "@/lib/auth/oauth-state";
import { authService } from "@/service/authService";



const APP_URL = process.env.APP_URL;

function getBaseUrl(request: Request): string {
  return APP_URL || request.url;
}

function redirectWithError(request: Request, errorCode: string) {
  return NextResponse.redirect(new URL(`/login?error=${errorCode}`, getBaseUrl(request)));
}

function redirectWithSuccess(request: Request, path: string, linked = false) {
  const url = new URL(path, getBaseUrl(request));
  if (linked) {
    url.searchParams.set("success", "google_linked");
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return redirectWithError(request, "oauth_denied");
    }

    if (!code || !state) {
      return redirectWithError(request, "oauth_failed");
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

    if (!storedState || storedState !== state) {
      return redirectWithError(request, "oauth_failed");
    }

    const statePayload = parseOAuthState(state);
    if (!statePayload) {
      return redirectWithError(request, "oauth_failed");
    }

    const profile = await exchangeCodeForProfile(code);
    if (!profile) {
      return redirectWithError(request, "oauth_failed");
    }

    if (!profile.emailVerified) {
      return redirectWithError(request, "google_email_unverified");
    }

    const result = await authService.loginWithGoogle({
      googleId: profile.googleId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      mode: statePayload.mode,
      roleId: statePayload.roleId,
      rememberMe: true,
      picture: profile.picture,
    });

    if (!result.success) {
      if (result.error.includes("Regístrate")) {
        return redirectWithError(request, "account_not_found");
      }
      return redirectWithError(request, "oauth_failed");
    }

    const response = redirectWithSuccess(
      request,
      getPostAuthRedirect(result.user),
      result.linked ?? false,
    );

    response.cookies.set("token", result.token, getAuthCookieOptions(true));
    response.cookies.delete(OAUTH_STATE_COOKIE);

    return response;
  } catch {
    return redirectWithError(request, "oauth_failed");
  }
}
