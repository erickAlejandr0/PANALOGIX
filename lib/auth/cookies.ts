import { REMEMBER_ME_MAX_AGE } from "./constants";

export function getAuthCookieOptions(rememberMe: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(rememberMe ? { maxAge: REMEMBER_ME_MAX_AGE } : {}),
  };
}
