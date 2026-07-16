import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAppBaseUrl } from "@/lib/auth/app-url";
import { verifyJwtToken } from "@/lib/auth/jwt";
import {
  getDashboardPath,
  getOnboardingPath,
  TRANSPORTISTA_CONTINUE_PATH,
} from "@/lib/auth/routes";
import { TRANSPORTISTA_ROLE_ID } from "@/lib/validations/onboarding";

function redirectToLogin(request: NextRequest, clearToken = false) {
  const url = new URL("/login", getAppBaseUrl(request.url));
  if (clearToken) {
    url.searchParams.set("error", "session_expired");
  }

  const response = NextResponse.redirect(url);
  if (clearToken) {
    response.cookies.delete("token");
  }
  return response;
}

function appRedirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, getAppBaseUrl(request.url)));
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (!token) {
    return redirectToLogin(request);
  }

  const payload = await verifyJwtToken(token);
  if (!payload) {
    return redirectToLogin(request, true);
  }

  const isOnboardingRoute = pathname.startsWith("/Onboarding");
  const isContinueAppRoute = pathname === TRANSPORTISTA_CONTINUE_PATH;
  const isProtectedMainRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/Publicaciones") ||
    pathname.startsWith("/entregas") ||
    pathname.startsWith("/verificacion") ||
    pathname.startsWith("/entrega-completada") ||
    pathname.startsWith("/Perfil");

  if (payload.roleId === TRANSPORTISTA_ROLE_ID) {
    if (isProtectedMainRoute) {
      return appRedirect(
        request,
        payload.onboardingCompleted
          ? TRANSPORTISTA_CONTINUE_PATH
          : getOnboardingPath(payload.roleId),
      );
    }

    if (isOnboardingRoute && payload.onboardingCompleted) {
      return appRedirect(request, TRANSPORTISTA_CONTINUE_PATH);
    }

    if (!payload.onboardingCompleted && isContinueAppRoute) {
      return appRedirect(request, getOnboardingPath(payload.roleId));
    }

    if (
      !payload.onboardingCompleted &&
      !isOnboardingRoute &&
      !isContinueAppRoute &&
      pathname !== "/login"
    ) {
      return appRedirect(request, getOnboardingPath(payload.roleId));
    }

    return NextResponse.next();
  }

  if (isOnboardingRoute && payload.onboardingCompleted) {
    return appRedirect(request, getDashboardPath(payload.roleId));
  }

  if (isProtectedMainRoute && !payload.onboardingCompleted) {
    return appRedirect(request, getOnboardingPath(payload.roleId));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/Onboarding/:path*",
    "/continuar-en-app",
    "/dashboard/:path*",
    "/Publicaciones/:path*",
    "/entregas/:path*",
    "/verificacion/:path*",
    "/entrega-completada/:path*",
    "/Perfil/:path*",
  ],
};
