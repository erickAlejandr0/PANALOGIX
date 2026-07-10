import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtToken } from "@/lib/auth/jwt";
import {
  getDashboardPath,
  getOnboardingPath,
  TRANSPORTISTA_CONTINUE_PATH,
} from "@/lib/auth/routes";
import { TRANSPORTISTA_ROLE_ID } from "@/lib/validations/onboarding";

function redirectToLogin(request: NextRequest, clearToken = false) {
  const url = new URL("/login", request.url);
  if (clearToken) {
    url.searchParams.set("error", "session_expired");
  }

  const response = NextResponse.redirect(url);
  if (clearToken) {
    response.cookies.delete("token");
  }
  return response;
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
      return NextResponse.redirect(
        new URL(
          payload.onboardingCompleted
            ? TRANSPORTISTA_CONTINUE_PATH
            : getOnboardingPath(payload.roleId),
          request.url,
        ),
      );
    }

    if (isOnboardingRoute && payload.onboardingCompleted) {
      return NextResponse.redirect(
        new URL(TRANSPORTISTA_CONTINUE_PATH, request.url),
      );
    }

    if (!payload.onboardingCompleted && isContinueAppRoute) {
      return NextResponse.redirect(
        new URL(getOnboardingPath(payload.roleId), request.url),
      );
    }

    if (
      !payload.onboardingCompleted &&
      !isOnboardingRoute &&
      !isContinueAppRoute &&
      pathname !== "/login"
    ) {
      return NextResponse.redirect(
        new URL(getOnboardingPath(payload.roleId), request.url),
      );
    }

    return NextResponse.next();
  }

  if (isOnboardingRoute && payload.onboardingCompleted) {
    return NextResponse.redirect(
      new URL(getDashboardPath(payload.roleId), request.url),
    );
  }

  if (isProtectedMainRoute && !payload.onboardingCompleted) {
    return NextResponse.redirect(
      new URL(getOnboardingPath(payload.roleId), request.url),
    );
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
